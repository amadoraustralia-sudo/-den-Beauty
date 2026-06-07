"use server";

import { createClient } from "@/lib/supabase/server";
import { getSalaoId } from "@/lib/supabase/salon";
import { revalidatePath } from "next/cache";

const STATUS_VALIDOS = ["aguardando", "confirmado", "concluido", "cancelado"] as const;
type StatusValido = typeof STATUS_VALIDOS[number];

export async function atualizarStatusAgendamento(id: string, status: StatusValido) {
  if (!STATUS_VALIDOS.includes(status)) return;

  const salao_id = await getSalaoId();
  if (!salao_id) return;

  const supabase = await createClient();

  const { error: updateError } = await supabase
    .from("agendamentos")
    .update({ status })
    .eq("id", id)
    .eq("salao_id", salao_id);
  if (updateError) return;

  // Calcula comissão automaticamente ao concluir
  if (status === "concluido") {
    const { data: ag } = await supabase
      .from("agendamentos")
      .select("id, data, valor, profissional_id, salao_id, servicos(preco)")
      .eq("id", id)
      .eq("salao_id", salao_id)
      .single();

    if (ag?.profissional_id) {
      const { data: prof } = await supabase
        .from("profissionais")
        .select("percentual_comissao")
        .eq("id", ag.profissional_id)
        .single();

      const svc = Array.isArray(ag.servicos) ? ag.servicos[0] : ag.servicos;
      const valorServico = Number(ag.valor ?? (svc as { preco: number } | null)?.preco ?? 0);
      const percentual = Number(prof?.percentual_comissao ?? 0);
      const valorComissao = valorServico * (percentual / 100);

      if (percentual > 0) {
        const { error: comissaoError } = await supabase.from("comissoes").upsert(
          {
            agendamento_id: ag.id,
            profissional_id: ag.profissional_id,
            valor_servico: valorServico,
            percentual,
            valor_comissao: valorComissao,
            data: ag.data ?? new Date().toISOString().split("T")[0],
            salao_id: (ag as { salao_id?: string }).salao_id ?? salao_id,
          },
          { onConflict: "agendamento_id" }
        );
        if (comissaoError) console.error("Erro ao salvar comissão:", comissaoError.message);
      }
    }
  }

  revalidatePath("/agendamentos");
  revalidatePath("/dashboard");
  revalidatePath("/relatorios");
}
