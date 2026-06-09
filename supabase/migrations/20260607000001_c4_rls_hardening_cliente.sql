-- =================================================================
-- C4 — Endurecer RLS: cliente não pode acessar dados do salão inteiro
--
-- Estratégia:
--   (1) get_my_salao_id() passa a IGNORAR o perfil 'cliente'. Como todas as
--       policies "*_own_salon" dependem dessa função, elas deixam de valer
--       para clientes automaticamente.
--   (2) Adicionam-se ao cliente apenas as policies próprias mínimas.
-- admin e super_admin NÃO mudam de comportamento.
-- =================================================================

CREATE OR REPLACE FUNCTION public.get_my_salao_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT salao_id
  FROM profiles
  WHERE id = auth.uid()
    AND role <> 'cliente'
  LIMIT 1;
$$;

-- Cliente cria o PRÓPRIO agendamento (portal /agendar/novo)
DROP POLICY IF EXISTS "agendamentos_client_insert_own" ON agendamentos;
CREATE POLICY "agendamentos_client_insert_own" ON agendamentos
  FOR INSERT TO authenticated
  WITH CHECK (
    cliente_id IN (SELECT id FROM clientes WHERE auth_user_id = auth.uid())
  );

-- Cliente cancela/atualiza o PRÓPRIO agendamento
DROP POLICY IF EXISTS "agendamentos_client_update_own" ON agendamentos;
CREATE POLICY "agendamentos_client_update_own" ON agendamentos
  FOR UPDATE TO authenticated
  USING      (cliente_id IN (SELECT id FROM clientes WHERE auth_user_id = auth.uid()))
  WITH CHECK (cliente_id IN (SELECT id FROM clientes WHERE auth_user_id = auth.uid()));

-- Cliente precisa LISTAR profissionais ativos para agendar
DROP POLICY IF EXISTS "profissionais_public_read" ON profissionais;
CREATE POLICY "profissionais_public_read" ON profissionais
  FOR SELECT USING (ativo = true);
