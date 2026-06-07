-- =================================================================
-- Fix: portal client registration - projeto yzqewgzgykclhyorjewz
-- Aplicar em: https://supabase.com/dashboard/project/yzqewgzgykclhyorjewz/sql/new
-- =================================================================

-- -------------------------------------------------------
-- 1. Garantir policies corretas na tabela clientes
-- -------------------------------------------------------
DROP POLICY IF EXISTS "client_read_own"   ON clientes;
DROP POLICY IF EXISTS "client_insert_own" ON clientes;
DROP POLICY IF EXISTS "client_update_own" ON clientes;
DROP POLICY IF EXISTS "clientes_self_read"   ON clientes;
DROP POLICY IF EXISTS "clientes_self_update" ON clientes;

-- Cliente lê apenas o próprio registro
CREATE POLICY "client_read_own" ON clientes
  FOR SELECT USING (auth_user_id = auth.uid());

-- Cliente pode criar o próprio registro (auto-cadastro pelo portal)
CREATE POLICY "client_insert_own" ON clientes
  FOR INSERT WITH CHECK (auth_user_id = auth.uid());

-- Cliente pode atualizar o próprio registro
CREATE POLICY "client_update_own" ON clientes
  FOR UPDATE USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());


-- -------------------------------------------------------
-- 2. Atualizar trigger handle_new_user para setar salao_id
--    quando um cliente se cadastra pelo portal
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_role     text;
  v_salao_id uuid;
BEGIN
  v_role := coalesce(new.raw_user_meta_data->>'role', 'cliente');

  -- Clientes do portal recebem o salao_id passado nos metadados
  -- (o app envia p_salao_id via signUp options.data)
  IF v_role = 'cliente' THEN
    v_salao_id := (new.raw_user_meta_data->>'salao_id')::uuid;
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
-- 3. Função SECURITY DEFINER para cadastro pelo portal
--    Bypassa RLS — cria ou vincula cliente com salao_id correto
-- -------------------------------------------------------
DROP FUNCTION IF EXISTS register_portal_client(text, text, text);
DROP FUNCTION IF EXISTS register_portal_client(text, text, text, uuid);

CREATE OR REPLACE FUNCTION register_portal_client(
  p_nome     text,
  p_email    text,
  p_telefone text,
  p_salao_id uuid DEFAULT NULL
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
  -- Resolve salao_id: usa o passado pelo app, ou busca o único ativo
  v_salao_id := p_salao_id;
  IF v_salao_id IS NULL THEN
    SELECT id INTO v_salao_id
    FROM configuracoes
    WHERE ativo = true
    LIMIT 1;
  END IF;

  -- Se já existe cliente com esse email, vincula o auth_user_id
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
    -- Cria novo cliente com salao_id e auth_user_id corretos
    INSERT INTO clientes (nome, email, telefone, auth_user_id, salao_id)
    VALUES (p_nome, p_email, p_telefone, v_uid, v_salao_id)
    RETURNING id INTO v_client_id;
  END IF;

  -- Garante que o profile do usuário tem salao_id
  IF v_uid IS NOT NULL THEN
    UPDATE profiles
    SET salao_id = COALESCE(salao_id, v_salao_id)
    WHERE id = v_uid;
  END IF;

  RETURN v_client_id;
END;
$$;

GRANT EXECUTE ON FUNCTION register_portal_client(text, text, text, uuid) TO authenticated, anon;


-- -------------------------------------------------------
-- 4. Backfill: profiles de clientes sem salao_id
-- -------------------------------------------------------
UPDATE profiles p
SET salao_id = c.salao_id
FROM clientes c
WHERE p.id = c.auth_user_id
  AND p.salao_id IS NULL
  AND c.salao_id IS NOT NULL;
