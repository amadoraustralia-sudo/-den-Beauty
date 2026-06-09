-- Migration: fix all columns required by n8n AGENTE EDENBEAUTY workflow
-- Applied 2026-05-02

-- 1. transacoes: missing forma_pagamento (used by GASTO, RECEITA, ATENDIMENTO)
--               missing profissional_id  (used by ATENDIMENTO)
ALTER TABLE transacoes
  ADD COLUMN IF NOT EXISTS forma_pagamento TEXT,
  ADD COLUMN IF NOT EXISTS profissional_id UUID REFERENCES profissionais(id);

-- 2. itens_transacao: missing tipo (servico | produto)
ALTER TABLE itens_transacao
  ADD COLUMN IF NOT EXISTS tipo TEXT;

-- 3. faltas_profissional: missing justificada and profissional_nome
ALTER TABLE faltas_profissional
  ADD COLUMN IF NOT EXISTS justificada  BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS profissional_nome TEXT;

-- 4. vales: missing profissional_nome (agent sends name, not UUID)
--           missing observacoes (table has 'observacao', agent sends 'observacoes')
ALTER TABLE vales
  ADD COLUMN IF NOT EXISTS profissional_nome TEXT,
  ADD COLUMN IF NOT EXISTS observacoes      TEXT;

-- 5. agendamentos: missing observacoes
ALTER TABLE agendamentos
  ADD COLUMN IF NOT EXISTS observacoes TEXT;
