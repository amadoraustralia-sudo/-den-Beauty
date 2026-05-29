"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const STATUS_VALIDOS = ["aguardando", "confirmado", "concluido", "cancelado"] as const;
type StatusValido = typeof STATUS_VALIDOS[number];

export async function atualizarStatusAgendamento(id: string, status: StatusValido) {
  if (!STATUS_VALIDOS.includes(status)) return;

  const supabase = await createClient();

  await supabase.from("agendamentos").update({ status }).eq("id", id);

  // Calcula comissão e cria lançamento financeiro automaticamente ao concluir
  if (status === "concluido") {
    const { data: ag } = await supabase
      .from("agendamentos")
      .select("id, data, valor, profissional_id, salao_id, servicos(nome, preco), clientes(nome)")
      .eq("id", id)
      .single();

    if (ag) {
      const svc = Array.isArray(ag.servicos) ? ag.servicos[0] : ag.servicos;
      const valorServico = Number(ag.valor ?? (svc as { preco: number } | null)?.preco ?? 0);
      const salaoId = (ag as { salao_id?: string }).salao_id ?? null;
      const nomeServico = (svc as { nome: string } | null)?.nome ?? "Atendimento";
      const nomeCliente = (Array.isArray(ag.clientes) ? ag.clientes[0] : ag.clientes as { nome: string } | null)?.nome;
      const dataAg = ag.data ?? new Date().toISOString().split("T")[0];

      // Lançamento financeiro automático (upsert por agendamento_id)
      if (valorServico > 0 && salaoId) {
        await supabase.from("transacoes").upsert(
          {
            agendamento_id: id,
            tipo: "entrada",
            descricao: nomeCliente ? `${nomeServico} — ${nomeCliente}` : nomeServico,
            valor: valorServico,
            data: dataAg,
            categoria: "Serviço",
            salao_id: salaoId,
          },
          { onConflict: "agendamento_id" }
        );
      }

      // Comissão do profissional
      if (ag.profissional_id) {
        const { data: prof } = await supabase
          .from("profissionais")
          .select("percentual_comissao")
          .eq("id", ag.profissional_id)
          .single();

        const percentual = Number(prof?.percentual_comissao ?? 0);
        const valorComissao = valorServico * (percentual / 100);

        if (percentual > 0) {
          await supabase.from("comissoes").upsert(
            {
              agendamento_id: ag.id,
              profissional_id: ag.profissional_id,
              valor_servico: valorServico,
              percentual,
              valor_comissao: valorComissao,
              data: dataAg,
              salao_id: salaoId,
            },
            { onConflict: "agendamento_id" }
          );
        }
      }
    }
  }

  revalidatePath("/agendamentos");
  revalidatePath("/dashboard");
  revalidatePath("/relatorios");
}
