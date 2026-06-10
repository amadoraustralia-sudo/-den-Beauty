-- Fix #1 — Landing page pública (/agendar) exibe profissionais para visitantes anon.
--           A migration anterior restringiu profissionais_public_read a 'authenticated'
--           o que quebrou a seção "Nossa equipe". Adiciona policy separada para anon.
CREATE POLICY "profissionais_anon_landing_read" ON profissionais
  FOR SELECT TO anon
  USING (ativo = true);

-- Fix #3 — Logo upload: a policy de INSERT estava irrestrita (qualquer autenticado
--           podia fazer upload na pasta de qualquer salão).
--           Restringe ao folder cujo nome corresponde ao salao_id do usuário logado.
DROP POLICY IF EXISTS "logos_authenticated_upload" ON storage.objects;
CREATE POLICY "logos_authenticated_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'logos'
    AND (storage.foldername(name))[1] = get_my_salao_id()::text
  );

-- Fix #5 — Indexes ausentes: auth_user_id em clientes é consultado em 5+ políticas RLS
--           sem índice, causando seq scan em toda avaliação de linha.
CREATE INDEX IF NOT EXISTS idx_clientes_auth_user_id  ON clientes(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_clientes_salao_id       ON clientes(salao_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_salao_id   ON agendamentos(salao_id);
CREATE INDEX IF NOT EXISTS idx_profissionais_salao_id  ON profissionais(salao_id);
CREATE INDEX IF NOT EXISTS idx_servicos_salao_id       ON servicos(salao_id);
