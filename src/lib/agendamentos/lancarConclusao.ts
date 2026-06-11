import type { SupabaseClient } from "@supabase/supabase-js";

interface LancarConclusaoParams {
  agendamento_id: string;
  salao_id: string;
  valor: number;
  data: string;
  profissional_id: string | null;
  forma_pagamento?: string | null;
  descricao: string;
}

/**
 * Cria/atualiza transação financeira e comissão do profissional ao concluir
 * um agendamento. Centraliza a lógica para evitar divergência entre os
 * fluxos de criação, edição e mudança de status.
 */
export async function lancarConclusao(
  supabase: SupabaseClient,
  { agendamento_id, salao_id, valor, data, profissional_id, forma_pagamento, descricao }: LancarConclusaoParams
): Promise<void> {
  await supabase.from("transacoes").upsert(
    {
      agendamento_id,
      tipo: "entrada",
      descricao,
      valor,
      data,
      categoria: "Serviço",
      salao_id,
      forma_pagamento: forma_pagamento ?? null,
    },
    { onConflict: "agendamento_id" }
  );

  if (!profissional_id) return;

  const { data: prof } = await supabase
    .from("profissionais")
    .select("percentual_comissao")
    .eq("id", profissional_id)
    .single();

  const percentual = Number(prof?.percentual_comissao ?? 0);
  if (percentual <= 0) return;

  await supabase.from("comissoes").upsert(
    {
      agendamento_id,
      profissional_id,
      valor_servico: valor,
      percentual,
      valor_comissao: valor * (percentual / 100),
      data,
      salao_id,
    },
    { onConflict: "agendamento_id" }
  );
}
