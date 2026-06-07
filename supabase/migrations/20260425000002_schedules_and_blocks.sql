-- Aplicar no Supabase Dashboard > SQL Editor
-- https://supabase.com/dashboard/project/yzqewgzgykclhyorjewz/sql/new

-- 1. horarios_semana por salão
ALTER TABLE configuracoes
  ADD COLUMN IF NOT EXISTS horarios_semana jsonb DEFAULT NULL;

-- 2. horarios_semana por profissional
ALTER TABLE profissionais
  ADD COLUMN IF NOT EXISTS horarios_semana jsonb DEFAULT NULL;

-- 3. Criar/garantir tabela horarios_bloqueados
CREATE TABLE IF NOT EXISTS horarios_bloqueados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE horarios_bloqueados
  ADD COLUMN IF NOT EXISTS salao_id uuid REFERENCES configuracoes(id),
  ADD COLUMN IF NOT EXISTS profissional_id uuid REFERENCES profissionais(id),
  ADD COLUMN IF NOT EXISTS data date,
  ADD COLUMN IF NOT EXISTS hora_inicio time,
  ADD COLUMN IF NOT EXISTS hora_fim time,
  ADD COLUMN IF NOT EXISTS motivo text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- 4. RLS para horarios_bloqueados
ALTER TABLE horarios_bloqueados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bloqueios_select_salon" ON horarios_bloqueados;
DROP POLICY IF EXISTS "bloqueios_insert_salon" ON horarios_bloqueados;
DROP POLICY IF EXISTS "bloqueios_delete_salon" ON horarios_bloqueados;
DROP POLICY IF EXISTS "bloqueios_select_anon"  ON horarios_bloqueados;

CREATE POLICY "bloqueios_select_salon" ON horarios_bloqueados
  FOR SELECT USING (salao_id = get_my_salao_id());

CREATE POLICY "bloqueios_insert_salon" ON horarios_bloqueados
  FOR INSERT WITH CHECK (salao_id = get_my_salao_id());

CREATE POLICY "bloqueios_delete_salon" ON horarios_bloqueados
  FOR DELETE USING (salao_id = get_my_salao_id());

-- anon pode ler bloqueios para geração de slots
CREATE POLICY "bloqueios_select_anon" ON horarios_bloqueados
  FOR SELECT TO anon, authenticated USING (true);

-- 5. RPC atualizada: per-day schedule + blocked slots
DROP FUNCTION IF EXISTS get_horarios_disponiveis(date, uuid, uuid, uuid);

CREATE OR REPLACE FUNCTION get_horarios_disponiveis(
  p_data          date,
  p_servico_id    uuid,
  p_profissional_id uuid DEFAULT NULL,
  p_salao_id      uuid DEFAULT NULL
)
RETURNS TABLE (hora text, profissional_id uuid, profissional_nome text, disponivel boolean)
LANGUAGE plpgsql AS $$
DECLARE
  v_abertura  time; v_fechamento time; v_intervalo int; v_antecedencia int;
  v_duracao   int;  v_slot_time  time; v_slot_fim  time;
  v_prof      RECORD; v_conflict_count int; v_block_count int;
  v_now_limit timestamptz; v_slot_dt timestamptz;
  v_dia_key   text; v_hs_salao jsonb; v_hs_prof jsonb; v_hs_dia jsonb;
BEGIN
  -- Dia da semana em pt-BR key
  v_dia_key := CASE EXTRACT(DOW FROM p_data)
    WHEN 0 THEN 'dom' WHEN 1 THEN 'seg' WHEN 2 THEN 'ter'
    WHEN 3 THEN 'qua' WHEN 4 THEN 'qui' WHEN 5 THEN 'sex' WHEN 6 THEN 'sab'
  END;

  SELECT horario_abertura::time, horario_fechamento::time,
         COALESCE(intervalo_agendamento,30), COALESCE(antecedencia_minima_horas,2),
         horarios_semana
  INTO v_abertura, v_fechamento, v_intervalo, v_antecedencia, v_hs_salao
  FROM configuracoes WHERE id = p_salao_id;
  IF NOT FOUND THEN RETURN; END IF;

  -- Verificar horário do salão neste dia
  IF v_hs_salao IS NOT NULL AND v_hs_salao->v_dia_key IS NOT NULL THEN
    v_hs_dia := v_hs_salao->v_dia_key;
    IF NOT COALESCE((v_hs_dia->>'ativo')::boolean, true) THEN RETURN; END IF;
    IF v_hs_dia->>'abre'  IS NOT NULL THEN v_abertura   := (v_hs_dia->>'abre')::time;  END IF;
    IF v_hs_dia->>'fecha' IS NOT NULL THEN v_fechamento := (v_hs_dia->>'fecha')::time; END IF;
  ELSE
    -- Fallback: verificar dias_funcionamento global
    IF NOT EXISTS (
      SELECT 1 FROM configuracoes
      WHERE id = p_salao_id AND v_dia_key = ANY(dias_funcionamento)
    ) THEN RETURN; END IF;
  END IF;

  SELECT duracao_min INTO v_duracao FROM servicos WHERE id = p_servico_id;
  IF NOT FOUND THEN RETURN; END IF;

  v_now_limit := NOW() + (v_antecedencia || ' hours')::interval;

  FOR v_prof IN
    SELECT p.id, p.nome, p.horarios_semana FROM profissionais p
    WHERE p.salao_id = p_salao_id AND p.ativo = true
      AND (p_profissional_id IS NULL OR p.id = p_profissional_id)
    ORDER BY p.nome
  LOOP
    -- Horário do profissional para este dia (pode sobrescrever o do salão)
    DECLARE
      v_prof_abertura  time := v_abertura;
      v_prof_fechamento time := v_fechamento;
    BEGIN
      v_hs_prof := v_prof.horarios_semana;
      IF v_hs_prof IS NOT NULL AND v_hs_prof->v_dia_key IS NOT NULL THEN
        v_hs_dia := v_hs_prof->v_dia_key;
        IF NOT COALESCE((v_hs_dia->>'ativo')::boolean, true) THEN CONTINUE; END IF;
        IF v_hs_dia->>'abre'  IS NOT NULL THEN v_prof_abertura   := (v_hs_dia->>'abre')::time;  END IF;
        IF v_hs_dia->>'fecha' IS NOT NULL THEN v_prof_fechamento := (v_hs_dia->>'fecha')::time; END IF;
      END IF;

      v_slot_time := v_prof_abertura;
      WHILE v_slot_time + (v_duracao || ' minutes')::interval <= v_prof_fechamento LOOP
        v_slot_fim := v_slot_time + (v_duracao || ' minutes')::interval;
        v_slot_dt  := (p_data::text || ' ' || v_slot_time::text)::timestamp;

        IF v_slot_dt >= v_now_limit THEN
          -- Conflito com agendamentos existentes
          SELECT COUNT(*) INTO v_conflict_count
          FROM agendamentos a LEFT JOIN servicos sv ON sv.id = a.servico_id
          WHERE a.profissional_id = v_prof.id AND a.data = p_data
            AND a.status NOT IN ('cancelado')
            AND a.hora::time < v_slot_fim
            AND a.hora::time + (COALESCE(sv.duracao_min, v_intervalo) || ' minutes')::interval > v_slot_time;

          -- Conflito com bloqueios pontuais
          SELECT COUNT(*) INTO v_block_count
          FROM horarios_bloqueados hb
          WHERE hb.profissional_id = v_prof.id AND hb.data = p_data
            AND hb.hora_inicio < v_slot_fim
            AND hb.hora_fim    > v_slot_time;

          RETURN QUERY SELECT
            to_char(v_slot_time,'HH24:MI:SS'),
            v_prof.id, v_prof.nome,
            (v_conflict_count = 0 AND v_block_count = 0);
        END IF;

        -- Pular intervalo do profissional (se configurado)
        IF v_hs_prof IS NOT NULL AND v_hs_prof->v_dia_key IS NOT NULL THEN
          v_hs_dia := v_hs_prof->v_dia_key;
          IF v_hs_dia->>'intervalo_inicio' IS NOT NULL AND v_hs_dia->>'intervalo_fim' IS NOT NULL THEN
            IF v_slot_time >= (v_hs_dia->>'intervalo_inicio')::time
               AND v_slot_time < (v_hs_dia->>'intervalo_fim')::time THEN
              v_slot_time := (v_hs_dia->>'intervalo_fim')::time;
              CONTINUE;
            END IF;
          END IF;
        END IF;

        v_slot_time := v_slot_time + (v_intervalo || ' minutes')::interval;
      END LOOP;
    END;
  END LOOP;
END; $$;

GRANT EXECUTE ON FUNCTION get_horarios_disponiveis(date,uuid,uuid,uuid) TO anon, authenticated, service_role;
