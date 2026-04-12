-- =============================================================
-- SEGURANÇA: Row-Level Security (RLS) — Multi-tenant isolation
-- Aplicar no Supabase Dashboard > SQL Editor
-- =============================================================

-- -------------------------------------------------------
-- 1. HABILITAR RLS EM TODAS AS TABELAS SENSÍVEIS
-- -------------------------------------------------------
ALTER TABLE clientes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE profissionais    ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE comissoes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;


-- -------------------------------------------------------
-- 2. FUNÇÃO AUXILIAR: retorna o salao_id do usuário logado
-- (lê da tabela profiles vinculada ao auth.uid())
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION get_my_salao_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT salao_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;


-- -------------------------------------------------------
-- 3. POLÍTICAS — CLIENTES
-- -------------------------------------------------------
DROP POLICY IF EXISTS "clientes_select_own_salon"  ON clientes;
DROP POLICY IF EXISTS "clientes_insert_own_salon"  ON clientes;
DROP POLICY IF EXISTS "clientes_update_own_salon"  ON clientes;
DROP POLICY IF EXISTS "clientes_delete_own_salon"  ON clientes;
DROP POLICY IF EXISTS "clientes_self_read"         ON clientes;
DROP POLICY IF EXISTS "clientes_self_update"       ON clientes;

-- Admin vê/gerencia apenas clientes do seu salão
CREATE POLICY "clientes_select_own_salon" ON clientes
  FOR SELECT USING (salao_id = get_my_salao_id());

CREATE POLICY "clientes_insert_own_salon" ON clientes
  FOR INSERT WITH CHECK (salao_id = get_my_salao_id());

CREATE POLICY "clientes_update_own_salon" ON clientes
  FOR UPDATE USING (salao_id = get_my_salao_id());

CREATE POLICY "clientes_delete_own_salon" ON clientes
  FOR DELETE USING (salao_id = get_my_salao_id());

-- Cliente loga e vê apenas seu próprio registro
CREATE POLICY "clientes_self_read" ON clientes
  FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY "clientes_self_update" ON clientes
  FOR UPDATE USING (auth_user_id = auth.uid());


-- -------------------------------------------------------
-- 4. POLÍTICAS — AGENDAMENTOS
-- -------------------------------------------------------
DROP POLICY IF EXISTS "agendamentos_select_own_salon" ON agendamentos;
DROP POLICY IF EXISTS "agendamentos_insert_own_salon" ON agendamentos;
DROP POLICY IF EXISTS "agendamentos_update_own_salon" ON agendamentos;
DROP POLICY IF EXISTS "agendamentos_delete_own_salon" ON agendamentos;
DROP POLICY IF EXISTS "agendamentos_self_read"        ON agendamentos;

CREATE POLICY "agendamentos_select_own_salon" ON agendamentos
  FOR SELECT USING (salao_id = get_my_salao_id());

CREATE POLICY "agendamentos_insert_own_salon" ON agendamentos
  FOR INSERT WITH CHECK (salao_id = get_my_salao_id());

CREATE POLICY "agendamentos_update_own_salon" ON agendamentos
  FOR UPDATE USING (salao_id = get_my_salao_id());

CREATE POLICY "agendamentos_delete_own_salon" ON agendamentos
  FOR DELETE USING (salao_id = get_my_salao_id());

-- Cliente vê seus próprios agendamentos (via cliente_id → auth_user_id)
CREATE POLICY "agendamentos_self_read" ON agendamentos
  FOR SELECT USING (
    cliente_id IN (
      SELECT id FROM clientes WHERE auth_user_id = auth.uid()
    )
  );


-- -------------------------------------------------------
-- 5. POLÍTICAS — PROFISSIONAIS
-- -------------------------------------------------------
DROP POLICY IF EXISTS "profissionais_select_own_salon" ON profissionais;
DROP POLICY IF EXISTS "profissionais_insert_own_salon" ON profissionais;
DROP POLICY IF EXISTS "profissionais_update_own_salon" ON profissionais;
DROP POLICY IF EXISTS "profissionais_delete_own_salon" ON profissionais;

CREATE POLICY "profissionais_select_own_salon" ON profissionais
  FOR SELECT USING (salao_id = get_my_salao_id());

CREATE POLICY "profissionais_insert_own_salon" ON profissionais
  FOR INSERT WITH CHECK (salao_id = get_my_salao_id());

CREATE POLICY "profissionais_update_own_salon" ON profissionais
  FOR UPDATE USING (salao_id = get_my_salao_id());

CREATE POLICY "profissionais_delete_own_salon" ON profissionais
  FOR DELETE USING (salao_id = get_my_salao_id());


-- -------------------------------------------------------
-- 6. POLÍTICAS — SERVIÇOS
-- (leitura pública para portal do cliente, escrita restrita)
-- -------------------------------------------------------
DROP POLICY IF EXISTS "servicos_public_read"         ON servicos;
DROP POLICY IF EXISTS "servicos_insert_own_salon"    ON servicos;
DROP POLICY IF EXISTS "servicos_update_own_salon"    ON servicos;
DROP POLICY IF EXISTS "servicos_delete_own_salon"    ON servicos;

-- Serviços são visíveis publicamente (necessário para portal de agendamento)
CREATE POLICY "servicos_public_read" ON servicos
  FOR SELECT USING (ativo = true);

-- Mas só admin do próprio salão pode criar/editar/deletar
CREATE POLICY "servicos_insert_own_salon" ON servicos
  FOR INSERT WITH CHECK (salao_id = get_my_salao_id());

CREATE POLICY "servicos_update_own_salon" ON servicos
  FOR UPDATE USING (salao_id = get_my_salao_id());

CREATE POLICY "servicos_delete_own_salon" ON servicos
  FOR DELETE USING (salao_id = get_my_salao_id());


-- -------------------------------------------------------
-- 7. POLÍTICAS — TRANSAÇÕES
-- -------------------------------------------------------
DROP POLICY IF EXISTS "transacoes_select_own_salon" ON transacoes;
DROP POLICY IF EXISTS "transacoes_insert_own_salon" ON transacoes;
DROP POLICY IF EXISTS "transacoes_update_own_salon" ON transacoes;
DROP POLICY IF EXISTS "transacoes_delete_own_salon" ON transacoes;

CREATE POLICY "transacoes_select_own_salon" ON transacoes
  FOR SELECT USING (salao_id = get_my_salao_id());

CREATE POLICY "transacoes_insert_own_salon" ON transacoes
  FOR INSERT WITH CHECK (salao_id = get_my_salao_id());

CREATE POLICY "transacoes_update_own_salon" ON transacoes
  FOR UPDATE USING (salao_id = get_my_salao_id());

CREATE POLICY "transacoes_delete_own_salon" ON transacoes
  FOR DELETE USING (salao_id = get_my_salao_id());


-- -------------------------------------------------------
-- 8. POLÍTICAS — COMISSÕES
-- -------------------------------------------------------
DROP POLICY IF EXISTS "comissoes_select_own_salon" ON comissoes;
DROP POLICY IF EXISTS "comissoes_insert_own_salon" ON comissoes;
DROP POLICY IF EXISTS "comissoes_update_own_salon" ON comissoes;

CREATE POLICY "comissoes_select_own_salon" ON comissoes
  FOR SELECT USING (salao_id = get_my_salao_id());

CREATE POLICY "comissoes_insert_own_salon" ON comissoes
  FOR INSERT WITH CHECK (salao_id = get_my_salao_id());

CREATE POLICY "comissoes_update_own_salon" ON comissoes
  FOR UPDATE USING (salao_id = get_my_salao_id());


-- -------------------------------------------------------
-- 9. POLÍTICAS — CONFIGURAÇÕES (salão)
-- -------------------------------------------------------
DROP POLICY IF EXISTS "configuracoes_owner_only"       ON configuracoes;
DROP POLICY IF EXISTS "configuracoes_public_slug_read" ON configuracoes;

-- Dono do salão gerencia suas próprias configurações
CREATE POLICY "configuracoes_owner_only" ON configuracoes
  FOR ALL USING (owner_user_id = auth.uid());

-- Portal público pode ler config pelo slug (necessário para portal de agendamento)
CREATE POLICY "configuracoes_public_slug_read" ON configuracoes
  FOR SELECT USING (true);


-- -------------------------------------------------------
-- 10. POLÍTICAS — PROFILES
-- -------------------------------------------------------
DROP POLICY IF EXISTS "profiles_self_read"   ON profiles;
DROP POLICY IF EXISTS "profiles_self_update" ON profiles;
DROP POLICY IF EXISTS "profiles_self_insert" ON profiles;

CREATE POLICY "profiles_self_read" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_self_update" ON profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "profiles_self_insert" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());
