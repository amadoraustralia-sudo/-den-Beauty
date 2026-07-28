-- Migration: Eva DM 1:1 — multi-tenant real
-- configuracoes ganha campos de ativacao da Eva; nova tabela eva_canais (canal WhatsApp -> salao).
-- O seed dos canais de producao (JIDs reais dos grupos atuais) NAO vai aqui: roda direto no Supabase
-- (contem IDs de producao, nao versionar).

ALTER TABLE configuracoes
  ADD COLUMN IF NOT EXISTS whatsapp_gestora text,
  ADD COLUMN IF NOT EXISTS eva_ativa        boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS eva_ativada_em   timestamptz;

CREATE TABLE IF NOT EXISTS eva_canais (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salao_id   uuid NOT NULL REFERENCES configuracoes(id) ON DELETE CASCADE,
  canal_jid  text NOT NULL UNIQUE,
  tipo       text NOT NULL CHECK (tipo IN ('grupo','dm')),
  ativo      boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE eva_canais ENABLE ROW LEVEL SECURITY;

-- O dono do salao enxerga/gerencia apenas os proprios canais (uso no painel).
-- O workflow n8n acessa esta tabela pela credencial Postgres, fora do RLS.
DROP POLICY IF EXISTS "eva_canais_owner_all" ON eva_canais;
CREATE POLICY "eva_canais_owner_all" ON eva_canais
  FOR ALL TO authenticated
  USING      (salao_id IN (SELECT id FROM configuracoes WHERE owner_user_id = auth.uid()))
  WITH CHECK (salao_id IN (SELECT id FROM configuracoes WHERE owner_user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_eva_canais_salao_id ON eva_canais(salao_id);
