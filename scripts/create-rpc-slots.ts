import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const sql = `
CREATE OR REPLACE FUNCTION get_horarios_disponiveis(
  p_data date,
  p_servico_id uuid,
  p_profissional_id uuid DEFAULT NULL,
  p_salao_id uuid DEFAULT NULL
)
RETURNS TABLE (hora text, profissional_id uuid, profissional_nome text, disponivel boolean)
LANGUAGE plpgsql AS $$
DECLARE
  v_abertura time; v_fechamento time; v_intervalo int; v_antecedencia int;
  v_duracao int; v_slot_time time; v_slot_fim time;
  v_prof RECORD; v_conflict_count int;
  v_now_limit timestamptz; v_slot_dt timestamptz;
BEGIN
  SELECT horario_abertura::time, horario_fechamento::time,
    COALESCE(intervalo_agendamento,30), COALESCE(antecedencia_minima_horas,2)
  INTO v_abertura, v_fechamento, v_intervalo, v_antecedencia
  FROM configuracoes WHERE id = p_salao_id;
  IF NOT FOUND THEN RETURN; END IF;

  SELECT duracao_min INTO v_duracao FROM servicos WHERE id = p_servico_id;
  IF NOT FOUND THEN RETURN; END IF;

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
      v_slot_dt := (p_data::text || ' ' || v_slot_time::text)::timestamp;
      IF v_slot_dt >= v_now_limit THEN
        SELECT COUNT(*) INTO v_conflict_count
        FROM agendamentos a LEFT JOIN servicos sv ON sv.id = a.servico_id
        WHERE a.profissional_id = v_prof.id AND a.data = p_data
          AND a.status NOT IN ('cancelado')
          AND a.hora::time < v_slot_fim
          AND a.hora::time + (COALESCE(sv.duracao_min, v_intervalo) || ' minutes')::interval > v_slot_time;
        RETURN QUERY SELECT to_char(v_slot_time,'HH24:MI:SS'), v_prof.id, v_prof.nome, (v_conflict_count=0);
      END IF;
      v_slot_time := v_slot_time + (v_intervalo || ' minutes')::interval;
    END LOOP;
  END LOOP;
END; $$;
`;

(supabase as any).rpc("query", { sql }).then(console.log).catch(async () => {
  // Fallback: use REST API
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/query`, {
    method: "POST",
    headers: {
      "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY!,
      "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql }),
  });
  console.log("status:", res.status);
});
