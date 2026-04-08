"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const STATUS_VALIDOS = ["aguardando", "confirmado", "concluido", "cancelado"] as const;
type StatusValido = typeof STATUS_VALIDOS[number];

export async function atualizarStatusAgendamento(id: string, status: StatusValido) {
  if (!STATUS_VALIDOS.includes(status)) return;

  const supabase = await createClient();

  await supabase.from("agendamentos").update({ status }).eq("id", id);

  // Calcula comissão automaticamente ao concluir
  if (status === "concluido") {
    const { data: ag } = await supabase
      .from("agendamentos")
      .select("id, data, valor, profissional_id, servicos(preco)")
      .eq("id", id)
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
        // Upsert para evitar duplicatas se o status for alterado novamente
        await supabase.from("comissoes").upsert(
          {
            agendamento_id: ag.id,
            profissional_id: ag.profissional_id,
            valor_servico: valorServico,
            percentual,
            valor_comissao: valorComissao,
            data: ag.data ?? new Date().toISOString().split("T")[0],
          },
          { onConflict: "agendamento_id" }
        );
      }
    }
  }

  revalidatePath("/agendamentos");
  revalidatePath("/dashboard");
  revalidatePath("/relatorios");
}
