-- =============================================
-- SCHEMA COMPLETO — Éden Beauty
-- Cole no Supabase → SQL Editor → New query
-- =============================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS configuracoes (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_estabelecimento      TEXT NOT NULL,
  slug                      TEXT UNIQUE NOT NULL,
  telefone                  TEXT,
  email                     TEXT,
  endereco                  TEXT,
  horario_abertura          TEXT DEFAULT '09:00',
  horario_fechamento        TEXT DEFAULT '19:00',
  dias_funcionamento        TEXT[] DEFAULT ARRAY['seg','ter','qua','qui','sex'],
  intervalo_agendamento     INTEGER DEFAULT 30,
  antecedencia_minima_horas INTEGER DEFAULT 2,
  cancelamento_horas        INTEGER DEFAULT 24,
  ativo                     BOOLEAN DEFAULT true,
  created_at                TIMESTAMPTZ DEFAULT now(),
  updated_at                TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role            TEXT NOT NULL DEFAULT 'cliente',
  nome            TEXT,
  telefone        TEXT,
  avatar_url      TEXT,
  ativo           BOOLEAN DEFAULT true,
  salao_id        UUID REFERENCES configuracoes(id) ON DELETE SET NULL,
  cliente_ref_id  UUID,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profissionais (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salao_id              UUID NOT NULL REFERENCES configuracoes(id) ON DELETE CASCADE,
  nome                  TEXT NOT NULL,
  cargo                 TEXT,
  email                 TEXT,
  telefone              TEXT,
  especialidades        TEXT[],
  percentual_comissao   NUMERIC(5,2) DEFAULT 0,
  periodo_fechamento    TEXT DEFAULT 'mensal',
  ativo                 BOOLEAN DEFAULT true,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clientes (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salao_id                  UUID NOT NULL REFERENCES configuracoes(id) ON DELETE CASCADE,
  auth_user_id              UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nome                      TEXT NOT NULL,
  email                     TEXT,
  telefone                  TEXT,
  data_nascimento           DATE,
  alergias                  TEXT,
  preferencias              TEXT,
  profissional_preferido_id UUID REFERENCES profissionais(id) ON DELETE SET NULL,
  total_visitas             INTEGER DEFAULT 0,
  ultima_visita             DATE,
  created_at                TIMESTAMPTZ DEFAULT now(),
  updated_at                TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS servicos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salao_id    UUID NOT NULL REFERENCES configuracoes(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  categoria   TEXT,
  descricao   TEXT,
  duracao_min INTEGER NOT NULL DEFAULT 60,
  preco       NUMERIC(10,2) NOT NULL DEFAULT 0,
  ativo       BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agendamentos (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salao_id         UUID NOT NULL REFERENCES configuracoes(id) ON DELETE CASCADE,
  cliente_id       UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  servico_id       UUID NOT NULL REFERENCES servicos(id) ON DELETE RESTRICT,
  profissional_id  UUID REFERENCES profissionais(id) ON DELETE SET NULL,
  data             DATE NOT NULL,
  hora             TIME NOT NULL,
  status           TEXT NOT NULL DEFAULT 'aguardando',
  valor            NUMERIC(10,2),
  forma_pagamento  TEXT,
  origem           TEXT DEFAULT 'admin',
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transacoes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salao_id    UUID NOT NULL REFERENCES configuracoes(id) ON DELETE CASCADE,
  tipo        TEXT NOT NULL,
  descricao   TEXT NOT NULL,
  valor       NUMERIC(10,2) NOT NULL,
  categoria   TEXT,
  data        DATE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS comissoes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salao_id        UUID NOT NULL REFERENCES configuracoes(id) ON DELETE CASCADE,
  agendamento_id  UUID UNIQUE REFERENCES agendamentos(id) ON DELETE CASCADE,
  profissional_id UUID NOT NULL REFERENCES profissionais(id) ON DELETE CASCADE,
  valor_servico   NUMERIC(10,2) NOT NULL,
  percentual      NUMERIC(5,2) NOT NULL,
  valor_comissao  NUMERIC(10,2) NOT NULL,
  data            DATE NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS horarios_bloqueados (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salao_id         UUID NOT NULL REFERENCES configuracoes(id) ON DELETE CASCADE,
  profissional_id  UUID REFERENCES profissionais(id) ON DELETE CASCADE,
  data             DATE NOT NULL,
  hora_inicio      TIME NOT NULL,
  hora_fim         TIME NOT NULL,
  motivo           TEXT,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_profiles_salao_id        ON profiles(salao_id);
CREATE INDEX IF NOT EXISTS idx_clientes_salao_id        ON clientes(salao_id);
CREATE INDEX IF NOT EXISTS idx_clientes_auth_user_id    ON clientes(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_profissionais_salao_id   ON profissionais(salao_id);
CREATE INDEX IF NOT EXISTS idx_servicos_salao_id        ON servicos(salao_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_salao_id    ON agendamentos(salao_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_data        ON agendamentos(data);
CREATE INDEX IF NOT EXISTS idx_transacoes_salao_id      ON transacoes(salao_id);
CREATE INDEX IF NOT EXISTS idx_comissoes_profissional   ON comissoes(profissional_id);

-- RLS
ALTER TABLE configuracoes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE profissionais       ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE comissoes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE horarios_bloqueados ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION get_my_salao_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT salao_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- profiles
CREATE POLICY "profiles_self_read"   ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_self_update" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profiles_self_insert" ON profiles FOR INSERT WITH CHECK (id = auth.uid());

-- configuracoes
CREATE POLICY "configuracoes_owner_only"       ON configuracoes FOR ALL    USING (owner_user_id = auth.uid());
CREATE POLICY "configuracoes_public_slug_read" ON configuracoes FOR SELECT USING (true);

-- clientes
CREATE POLICY "clientes_select_own_salon" ON clientes FOR SELECT USING (salao_id = get_my_salao_id());
CREATE POLICY "clientes_insert_own_salon" ON clientes FOR INSERT WITH CHECK (salao_id = get_my_salao_id());
CREATE POLICY "clientes_update_own_salon" ON clientes FOR UPDATE USING (salao_id = get_my_salao_id());
CREATE POLICY "clientes_delete_own_salon" ON clientes FOR DELETE USING (salao_id = get_my_salao_id());
CREATE POLICY "clientes_self_read"        ON clientes FOR SELECT USING (auth_user_id = auth.uid());
CREATE POLICY "clientes_self_update"      ON clientes FOR UPDATE USING (auth_user_id = auth.uid());

-- agendamentos
CREATE POLICY "agendamentos_select_own_salon" ON agendamentos FOR SELECT USING (salao_id = get_my_salao_id());
CREATE POLICY "agendamentos_insert_own_salon" ON agendamentos FOR INSERT WITH CHECK (salao_id = get_my_salao_id());
CREATE POLICY "agendamentos_update_own_salon" ON agendamentos FOR UPDATE USING (salao_id = get_my_salao_id());
CREATE POLICY "agendamentos_delete_own_salon" ON agendamentos FOR DELETE USING (salao_id = get_my_salao_id());
CREATE POLICY "agendamentos_self_read"        ON agendamentos FOR SELECT USING (
  cliente_id IN (SELECT id FROM clientes WHERE auth_user_id = auth.uid())
);

-- profissionais
CREATE POLICY "profissionais_select_own_salon" ON profissionais FOR SELECT USING (salao_id = get_my_salao_id());
CREATE POLICY "profissionais_insert_own_salon" ON profissionais FOR INSERT WITH CHECK (salao_id = get_my_salao_id());
CREATE POLICY "profissionais_update_own_salon" ON profissionais FOR UPDATE USING (salao_id = get_my_salao_id());
CREATE POLICY "profissionais_delete_own_salon" ON profissionais FOR DELETE USING (salao_id = get_my_salao_id());

-- servicos
CREATE POLICY "servicos_public_read"      ON servicos FOR SELECT USING (ativo = true);
CREATE POLICY "servicos_insert_own_salon" ON servicos FOR INSERT WITH CHECK (salao_id = get_my_salao_id());
CREATE POLICY "servicos_update_own_salon" ON servicos FOR UPDATE USING (salao_id = get_my_salao_id());
CREATE POLICY "servicos_delete_own_salon" ON servicos FOR DELETE USING (salao_id = get_my_salao_id());

-- transacoes
CREATE POLICY "transacoes_select_own_salon" ON transacoes FOR SELECT USING (salao_id = get_my_salao_id());
CREATE POLICY "transacoes_insert_own_salon" ON transacoes FOR INSERT WITH CHECK (salao_id = get_my_salao_id());
CREATE POLICY "transacoes_update_own_salon" ON transacoes FOR UPDATE USING (salao_id = get_my_salao_id());
CREATE POLICY "transacoes_delete_own_salon" ON transacoes FOR DELETE USING (salao_id = get_my_salao_id());

-- comissoes
CREATE POLICY "comissoes_select_own_salon" ON comissoes FOR SELECT USING (salao_id = get_my_salao_id());
CREATE POLICY "comissoes_insert_own_salon" ON comissoes FOR INSERT WITH CHECK (salao_id = get_my_salao_id());
CREATE POLICY "comissoes_update_own_salon" ON comissoes FOR UPDATE USING (salao_id = get_my_salao_id());

-- horarios
CREATE POLICY "horarios_select_own_salon" ON horarios_bloqueados FOR SELECT USING (salao_id = get_my_salao_id());
CREATE POLICY "horarios_insert_own_salon" ON horarios_bloqueados FOR INSERT WITH CHECK (salao_id = get_my_salao_id());
CREATE POLICY "horarios_update_own_salon" ON horarios_bloqueados FOR UPDATE USING (salao_id = get_my_salao_id());
CREATE POLICY "horarios_delete_own_salon" ON horarios_bloqueados FOR DELETE USING (salao_id = get_my_salao_id());
