-- =============================================================
-- Fix: serviços RLS — admin precisa ler serviços inativos
--      (ex: página de editar serviço inativo)
-- Fix: profiles.salao_id deve ser sempre sincronizado com o
--      salão do dono para que get_my_salao_id() retorne valor
--      correto nas políticas RLS de insert/update.
-- =============================================================

-- -------------------------------------------------------
-- 1. SERVIÇOS: substituir a política de SELECT pública
--    por duas políticas separadas:
--    a) Leitura pública de serviços ativos (portal do cliente)
--    b) Admin do próprio salão pode ler TODOS os seus serviços
--       (inclusive inativos) — necessário para a tela de edição
-- -------------------------------------------------------
DROP POLICY IF EXISTS "servicos_public_read"      ON servicos;
DROP POLICY IF EXISTS "servicos_admin_read"       ON servicos;

-- Portal público vê apenas serviços ativos
CREATE POLICY "servicos_public_read" ON servicos
  FOR SELECT USING (ativo = true);

-- Admin vê todos os serviços do seu próprio salão (ativos e inativos)
CREATE POLICY "servicos_admin_read" ON servicos
  FOR SELECT USING (salao_id = get_my_salao_id());


-- -------------------------------------------------------
-- 2. PROFILES: garantir que o dono do salão possa atualizar
--    seu próprio salao_id (necessário para a sincronização
--    automática feita pelo getSalaoId())
-- -------------------------------------------------------
DROP POLICY IF EXISTS "profiles_self_update" ON profiles;

CREATE POLICY "profiles_self_update" ON profiles
  FOR UPDATE USING (id = auth.uid());
