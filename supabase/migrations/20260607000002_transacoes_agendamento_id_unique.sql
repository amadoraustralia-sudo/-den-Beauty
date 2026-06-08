-- =================================================================
-- C3 — Índice único em transacoes.agendamento_id
-- Necessário para o upsert(onConflict: "agendamento_id") do lançamento
-- financeiro automático funcionar (ao concluir/criar agendamento concluído).
-- =================================================================

CREATE UNIQUE INDEX IF NOT EXISTS transacoes_agendamento_id_key
  ON transacoes (agendamento_id);
