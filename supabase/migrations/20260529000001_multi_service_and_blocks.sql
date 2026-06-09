-- =================================================================
-- Multi-service bookings + blocked slots in availability RPC
-- Aplicar em: https://supabase.com/dashboard/project/yzqewgzgykclhyorjewz/sql/new
-- =================================================================

-- 1. Coluna para serviços adicionais no agendamento
ALTER TABLE agendamentos
  ADD COLUMN IF NOT EXISTS servicos_adicionais jsonb DEFAULT '[]'::jsonb;


-- 2. get_horarios_disponiveis atualizado:
--    - Respeita horarios_semana por dia
--    - Verifica horarios_bloqueados
--    - Aceita p_duracao_total para múltiplos serviços
DROP FUNCTION IF EXISTS get_horarios_disponiveis(date, uuid, uuid, uuid);
DROP FUNCTION IF EXISTS get_horarios_disponiveis(date, uuid, uuid, uuid, int);

CREATE OR REPLACE FUNCTION get_horarios_disponiveis(
  p_data            date,
  p_servico_id      uuid,
  p_profissional_id uuid DEFAULT NULL,
  p_salao_id        uuid DEFAULT NULL,
  p_duracao_total   int  DEFAULT NULL
)
RETURNS TABLE (hora text, profissional_id uuid, profissional_nome text, disponivel boolean)
LANGUAGE plpgsql AS $$
DECLARE
  v_abertura    time;
  v_fechamento  time;
  v_intervalo   int;
  v_antecedencia int;
  v_duracao     int;
  v_slot_time   time;
  v_slot_fim    time;
  v_prof        RECORD;
  v_conflict    int;
  v_blocked     int;
  v_now_limit   timestamptz;
  v_slot_dt     timestamptz;
  v_config      RECORD;
  v_dia_key     text;
  v_dia_cfg     jsonb;
BEGIN
  SELECT * INTO v_config FROM configuracoes WHERE id = p_salao_id;
  IF NOT FOUND THEN RETURN; END IF;

  v_intervalo    := COALESCE(v_config.intervalo_agendamento, 30);
  v_antecedencia := COALESCE(v_config.antecedencia_minima_horas, 2);

  -- Resolve horário do dia da semana (dom=0 … sab=6)
  v_dia_key := (ARRAY['dom','seg','ter','qua','qui','sex','sab'])
               [EXTRACT(DOW FROM p_data)::int + 1];
  v_dia_cfg := v_config.horarios_semana -> v_dia_key;

  IF v_dia_cfg IS NOT NULL AND (v_dia_cfg->>'ativo')::boolean = false THEN
    RETURN; -- dia fechado
  ELSIF v_dia_cfg IS NOT NULL AND (v_dia_cfg->>'ativo')::boolean = true THEN
    v_abertura   := (v_dia_cfg->>'abre')::time;
    v_fechamento := (v_dia_cfg->>'fecha')::time;
  ELSE
    v_abertura   := v_config.horario_abertura::time;
    v_fechamento := v_config.horario_fechamento::time;
  END IF;

  -- Duração total (serviço principal + extras)
  v_duracao := COALESCE(
    p_duracao_total,
    (SELECT duracao_min FROM servicos WHERE id = p_servico_id)
  );
  IF v_duracao IS NULL THEN RETURN; END IF;

  v_now_limit := NOW() + (v_antecedencia || ' hours')::interval;

  FOR v_prof IN
    SELECT p.id, p.nome FROM profissionais p
    WHERE p.salao_id = p_salao_id AND p.ativo = true
      AND (p_profissional_id IS NULL OR p.id = p_profissional_id)
    ORDER BY p.nome
  LOOP
    v_slot_time := v_abertura;
    WHILE v_slot_time + (v_duracao || ' minutes')::interval <= v_fechamento LOOP
      v_slot_fim := v_slot_time + (v_duracao || ' minutes')::interval;
      v_slot_dt  := (p_data::text || ' ' || v_slot_time::text)::timestamp;

      IF v_slot_dt >= v_now_limit THEN
        -- Conflitos com agendamentos
        SELECT COUNT(*) INTO v_conflict
        FROM agendamentos a
        LEFT JOIN servicos sv ON sv.id = a.servico_id
        WHERE a.profissional_id = v_prof.id
          AND a.data = p_data
          AND a.status NOT IN ('cancelado')
          AND a.hora::time < v_slot_fim
          AND a.hora::time + (COALESCE(sv.duracao_min, v_intervalo) || ' minutes')::interval > v_slot_time;

        -- Horários bloqueados pela gestora
        SELECT COUNT(*) INTO v_blocked
        FROM horarios_bloqueados hb
        WHERE hb.profissional_id = v_prof.id
          AND hb.data = p_data
          AND hb.salao_id = p_salao_id
          AND hb.hora_inicio::time < v_slot_fim
          AND hb.hora_fim::time > v_slot_time;

        RETURN QUERY
          SELECT to_char(v_slot_time,'HH24:MI:SS'),
                 v_prof.id,
                 v_prof.nome,
                 (v_conflict = 0 AND v_blocked = 0);
      END IF;

      v_slot_time := v_slot_time + (v_intervalo || ' minutes')::interval;
    END LOOP;
  END LOOP;
END; $$;

GRANT EXECUTE ON FUNCTION get_horarios_disponiveis(date, uuid, uuid, uuid, int)
  TO anon, authenticated, service_role;
