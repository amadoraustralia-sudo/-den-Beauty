-- Migration: portal RPC v2 (jun/2026)
-- 1. Expande get_configuracoes_portal com campos extras (endereco, horarios)
-- 2. Adiciona deletar_salao() SECURITY DEFINER para deleção atômica (M4)

-- ============================================================
-- Expande get_configuracoes_portal (CREATE OR REPLACE seguro)
-- ============================================================

CREATE OR REPLACE FUNCTION get_configuracoes_portal(p_slug TEXT)
RETURNS TABLE (
  id                   UUID,
  nome_estabelecimento TEXT,
  logo_url             TEXT,
  telefone             TEXT,
  slug                 TEXT,
  endereco             TEXT,
  horario_abertura     TIME,
  horario_fechamento   TIME
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id, nome_estabelecimento, logo_url, telefone, slug,
         endereco, horario_abertura, horario_fechamento
  FROM configuracoes
  WHERE slug = p_slug
    AND ativo = true
    AND slug IS NOT NULL;
$$;

GRANT EXECUTE ON FUNCTION get_configuracoes_portal(TEXT) TO anon, authenticated;

-- ============================================================
-- deletar_salao — deleta todos os dados de um salão atomicamente
-- Só super_admin pode executar (verificado dentro da função)
-- ============================================================

CREATE OR REPLACE FUNCTION deletar_salao(p_salao_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = v_uid AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  DELETE FROM comissoes            WHERE salao_id = p_salao_id;
  DELETE FROM transacoes           WHERE salao_id = p_salao_id;
  DELETE FROM horarios_bloqueados  WHERE salao_id = p_salao_id;
  DELETE FROM agendamentos         WHERE salao_id = p_salao_id;
  DELETE FROM clientes             WHERE salao_id = p_salao_id;
  DELETE FROM servicos             WHERE salao_id = p_salao_id;
  DELETE FROM profissionais        WHERE salao_id = p_salao_id;
  UPDATE profiles SET salao_id = NULL WHERE salao_id = p_salao_id;
  DELETE FROM configuracoes        WHERE id = p_salao_id;
END;
$$;

GRANT EXECUTE ON FUNCTION deletar_salao(UUID) TO authenticated;
