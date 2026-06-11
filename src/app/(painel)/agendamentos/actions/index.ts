"use server";

import { createClient } from "@/lib/supabase/server";
import { getSalaoId } from "@/lib/supabase/salon";
import { lancarConclusao } from "@/lib/agendamentos/lancarConclusao";
import { revalidatePath } from "next/cache";

const STATUS_VALIDOS = ["aguardando", "confirmado", "concluido", "cancelado"] as const;
type StatusValido = typeof STATUS_VALIDOS[number];

export async function atualizarStatusAgendamento(id: string, status: StatusValido): Promise<{ error: boolean }> {
  if (!STATUS_VALIDOS.includes(status)) return { error: true };

  const salao_id = await getSalaoId();
  if (!salao_id) return { error: true };

  const supabase = await createClient();

  // UPDATE com escopo de tenant + retorna dados necessários para pós-processamento
  // Usar .select() no update elimina o segundo SELECT e detecta 0 rows atualizadas
  const { data: ag, error: updateError } = await supabase
    .from("agendamentos")
    .update({ status })
    .eq("id", id)
    .eq("salao_id", salao_id)
    .select("id, data, valor, profissional_id, salao_id, servicos(nome, preco), clientes(nome)")
    .single();

  if (updateError || !ag) return { error: true };

  if (status === "concluido") {
    const svc = Array.isArray(ag.servicos) ? ag.servicos[0] : ag.servicos;
    const valorServico = Number(ag.valor ?? (svc as { preco: number } | null)?.preco ?? 0);
    const salaoId = (ag as { salao_id?: string }).salao_id ?? salao_id;
    const nomeServico = (svc as { nome: string } | null)?.nome ?? "Atendimento";
    const nomeCliente = (Array.isArray(ag.clientes) ? ag.clientes[0] : ag.clientes as { nome: string } | null)?.nome;

    if (valorServico > 0) {
      await lancarConclusao(supabase, {
        agendamento_id: id,
        salao_id: salaoId,
        valor: valorServico,
        data: ag.data ?? new Date().toISOString().split("T")[0],
        profissional_id: ag.profissional_id,
        descricao: nomeCliente ? `${nomeServico} — ${nomeCliente}` : nomeServico,
      });
    }
  }

  revalidatePath("/agendamentos");
  revalidatePath("/dashboard");
  revalidatePath("/relatorios");
  return { error: false };
}
