-- Adiciona agendamento_id em transacoes para vincular e deduplicar
-- lançamentos automáticos gerados ao concluir um agendamento.
ALTER TABLE transacoes
  ADD COLUMN IF NOT EXISTS agendamento_id UUID REFERENCES agendamentos(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS transacoes_agendamento_id_unique
  ON transacoes(agendamento_id)
  WHERE agendamento_id IS NOT NULL;
