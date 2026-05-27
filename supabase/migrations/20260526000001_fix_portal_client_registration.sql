-- =================================================================
-- Fix: portal client registration
-- Problems fixed:
--   1. handle_new_user trigger wasn't setting salao_id in profiles
--      → get_my_salao_id() returned NULL for portal users
--   2. clientes inserted without salao_id → booking flow broken
--   3. n8n clients have no auth_user_id → RLS can't find them
-- =================================================================

-- -------------------------------------------------------
-- 1. Update handle_new_user to set salao_id for portal clients
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_role text;
  v_salao_id uuid;
BEGIN
  v_role := coalesce(new.raw_user_meta_data->>'role', 'cliente');

  -- Portal clients get assigned to the salon automatically
  IF v_role = 'cliente' THEN
    SELECT id INTO v_salao_id
    FROM configuracoes
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  INSERT INTO public.profiles (id, role, nome, salao_id)
  VALUES (
    new.id,
    v_role,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    v_salao_id
  )
  ON CONFLICT (id) DO UPDATE
    SET salao_id = COALESCE(profiles.salao_id, EXCLUDED.salao_id);

  RETURN new;
END;
$$;


-- -------------------------------------------------------
-- 2. SECURITY DEFINER function for portal self-registration
--    Bypasses RLS to correctly create/link a client with
--    the salon's salao_id, regardless of session state.
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION register_portal_client(
  p_nome     text,
  p_email    text,
  p_telefone text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_salao_id  uuid;
  v_client_id uuid;
  v_uid       uuid := auth.uid();
BEGIN
  -- Get the portal's salon (oldest config = landing page default)
  SELECT id INTO v_salao_id
  FROM configuracoes
  ORDER BY created_at ASC
  LIMIT 1;

  -- If a client already exists with this email, link them
  SELECT id INTO v_client_id
  FROM clientes
  WHERE email = p_email
  LIMIT 1;

  IF v_client_id IS NOT NULL THEN
    UPDATE clientes
    SET
      auth_user_id = COALESCE(auth_user_id, v_uid),
      salao_id     = COALESCE(salao_id, v_salao_id)
    WHERE id = v_client_id;
  ELSE
    -- Create new client with correct salao_id
    INSERT INTO clientes (nome, email, telefone, auth_user_id, salao_id)
    VALUES (p_nome, p_email, p_telefone, v_uid, v_salao_id)
    RETURNING id INTO v_client_id;
  END IF;

  -- Ensure the user's profile has salao_id set
  IF v_uid IS NOT NULL THEN
    UPDATE profiles
    SET salao_id = COALESCE(salao_id, v_salao_id)
    WHERE id = v_uid;
  END IF;

  RETURN v_client_id;
END;
$$;

GRANT EXECUTE ON FUNCTION register_portal_client TO authenticated, anon;


-- -------------------------------------------------------
-- 3. Backfill: set salao_id for orphaned profile records
-- -------------------------------------------------------
UPDATE profiles
SET salao_id = (SELECT id FROM configuracoes ORDER BY created_at ASC LIMIT 1)
WHERE role = 'cliente'
  AND salao_id IS NULL;


-- -------------------------------------------------------
-- 4. Backfill: set salao_id for clients linked via profile
-- -------------------------------------------------------
UPDATE clientes c
SET salao_id = p.salao_id
FROM profiles p
WHERE c.auth_user_id = p.id
  AND c.salao_id IS NULL
  AND p.salao_id IS NOT NULL;

-- Remaining clients with no salao_id get the default salon
UPDATE clientes
SET salao_id = (SELECT id FROM configuracoes ORDER BY created_at ASC LIMIT 1)
WHERE salao_id IS NULL;
