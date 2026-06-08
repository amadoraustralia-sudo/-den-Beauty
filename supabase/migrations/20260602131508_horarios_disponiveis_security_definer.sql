-- =================================================================
-- get_horarios_disponiveis -> SECURITY DEFINER + search_path fixo
-- Versao de 4 argumentos (servico unico).
-- Reconciliacao: aplicado no banco em 2026-06-02, faltava no GitHub.
-- =================================================================

CREATE OR REPLACE FUNCTION public.get_horarios_disponiveis(
  p_data            date,
  p_servico_id      uuid,
  p_profissional_id uuid DEFAULT NULL::uuid,
  p_salao_id        uuid DEFAULT NULL::uuid
)
RETURNS TABLE(hora text, profissional_id uuid, profissional_nome text, disponivel boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_abertura   time; v_fechamento  time; v_intervalo int; v_antecedencia int;
  v_duracao    int;  v_slot_time   time; v_slot_fim   time;
  v_prof       RECORD; v_conflict_count int; v_block_count int;
  v_now_limit  timestamp;
  v_slot_dt    timestamp;
  v_dia_key    text; v_hs_salao jsonb; v_hs_prof jsonb; v_hs_dia jsonb;
BEGIN
  v_dia_key := CASE EXTRACT(DOW FROM p_data)
    WHEN 0 THEN 'dom' WHEN 1 THEN 'seg' WHEN 2 THEN 'ter'
    WHEN 3 THEN 'qua' WHEN 4 THEN 'qui' WHEN 5 THEN 'sex' WHEN 6 THEN 'sab'
  END;

  SELECT horario_abertura::time, horario_fechamento::time,
         COALESCE(intervalo_agendamento, 30), COALESCE(antecedencia_minima_horas, 2),
         horarios_semana
  INTO v_abertura, v_fechamento, v_intervalo, v_antecedencia, v_hs_salao
  FROM configuracoes WHERE id = p_salao_id;
  IF NOT FOUND THEN RETURN; END IF;

  IF v_hs_salao IS NOT NULL AND v_hs_salao->v_dia_key IS NOT NULL THEN
    v_hs_dia := v_hs_salao->v_dia_key;
    IF NOT COALESCE((v_hs_dia->>'ativo')::boolean, true) THEN RETURN; END IF;
    IF v_hs_dia->>'abre'  IS NOT NULL THEN v_abertura   := (v_hs_dia->>'abre')::time;  END IF;
    IF v_hs_dia->>'fecha' IS NOT NULL THEN v_fechamento := (v_hs_dia->>'fecha')::time; END IF;
  ELSE
    IF NOT EXISTS (
      SELECT 1 FROM configuracoes
      WHERE id = p_salao_id AND v_dia_key = ANY(dias_funcionamento)
    ) THEN RETURN; END IF;
  END IF;

  SELECT duracao_min INTO v_duracao FROM servicos WHERE id = p_servico_id;
  IF NOT FOUND THEN RETURN; END IF;

  v_now_limit := (NOW() AT TIME ZONE 'America/Sao_Paulo') + (v_antecedencia || ' hours')::interval;

  FOR v_prof IN
    SELECT p.id, p.nome, p.horarios_semana FROM profissionais p
    WHERE p.salao_id = p_salao_id AND p.ativo = true
      AND (p_profissional_id IS NULL OR p.id = p_profissional_id)
    ORDER BY p.nome
  LOOP
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
          SELECT COUNT(*) INTO v_conflict_count
          FROM agendamentos a LEFT JOIN servicos sv ON sv.id = a.servico_id
          WHERE a.profissional_id = v_prof.id AND a.data = p_data
            AND a.status NOT IN ('cancelado')
            AND a.hora::time < v_slot_fim
            AND a.hora::time + (COALESCE(sv.duracao_min, v_intervalo) || ' minutes')::interval > v_slot_time;

          SELECT COUNT(*) INTO v_block_count
          FROM horarios_bloqueados hb
          WHERE hb.profissional_id = v_prof.id AND hb.data = p_data
            AND hb.hora_inicio < v_slot_fim
            AND hb.hora_fim    > v_slot_time;

          RETURN QUERY SELECT
            to_char(v_slot_time, 'HH24:MI:SS'),
            v_prof.id, v_prof.nome,
            (v_conflict_count = 0 AND v_block_count = 0);
        END IF;

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
END; $function$;

GRANT EXECUTE ON FUNCTION get_horarios_disponiveis(date, uuid, uuid, uuid)
  TO anon, authenticated, service_role;
