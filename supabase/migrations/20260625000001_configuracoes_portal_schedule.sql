-- Migration: expande get_configuracoes_portal com horarios_semana e dias_funcionamento
-- Necessário: DROP pois o tipo de retorno muda (adição de colunas)

DROP FUNCTION IF EXISTS get_configuracoes_portal(TEXT);

CREATE OR REPLACE FUNCTION get_configuracoes_portal(p_slug TEXT)
RETURNS TABLE (
  id                   UUID,
  nome_estabelecimento TEXT,
  logo_url             TEXT,
  telefone             TEXT,
  slug                 TEXT,
  endereco             TEXT,
  horario_abertura     TIME,
  horario_fechamento   TIME,
  horarios_semana      JSONB,
  dias_funcionamento   TEXT[]
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id, nome_estabelecimento, logo_url, telefone, slug,
         endereco, horario_abertura, horario_fechamento,
         horarios_semana, dias_funcionamento
  FROM configuracoes
  WHERE slug = p_slug
    AND ativo = true
    AND slug IS NOT NULL;
$$;

GRANT EXECUTE ON FUNCTION get_configuracoes_portal(TEXT) TO anon, authenticated;
