"use server";

import { createClient } from "@/lib/supabase/server";
import { getSalaoId } from "@/lib/supabase/salon";
import { lancarConclusao } from "@/lib/agendamentos/lancarConclusao";
import { redirect } from "next/navigation";

const STATUS_VALIDOS = ["aguardando", "confirmado", "concluido", "cancelado"] as const;
const PAGAMENTO_VALIDOS = ["pix", "credito", "debito", "dinheiro"] as const;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^\d{2}:\d{2}(:\d{2})?$/;

type StatusValido = typeof STATUS_VALIDOS[number];
type PagamentoValido = typeof PAGAMENTO_VALIDOS[number];

export async function atualizarAgendamento(formData: FormData) {
  const id          = (formData.get("id") as string)?.trim();
  const cliente_id  = (formData.get("cliente_id") as string)?.trim();
  const servico_id  = (formData.get("servico_id") as string)?.trim();
  const data        = (formData.get("data") as string)?.trim();
  const hora        = (formData.get("hora") as string)?.trim();
  const statusRaw   = (formData.get("status") as string)?.trim() || "aguardando";
  const pagamentoRaw = (formData.get("forma_pagamento") as string)?.trim() || null;

  if (!id)         return { error: "ID inválido." };
  if (!cliente_id) return { error: "Selecione um cliente." };
  if (!servico_id) return { error: "Selecione um serviço." };
  if (!data || !DATE_REGEX.test(data)) return { error: "Data inválida." };
  if (!hora || !TIME_REGEX.test(hora)) return { error: "Horário inválido." };
  if (!STATUS_VALIDOS.includes(statusRaw as StatusValido)) return { error: "Status inválido." };

  const status = statusRaw as StatusValido;
  if (status === "concluido" && !pagamentoRaw) return { error: "Forma de pagamento obrigatória ao concluir." };
  if (pagamentoRaw && !PAGAMENTO_VALIDOS.includes(pagamentoRaw as PagamentoValido)) return { error: "Forma de pagamento inválida." };

  const forma_pagamento = pagamentoRaw as PagamentoValido | null;
  const profissional_id = (formData.get("profissional_id") as string)?.trim() || null;
  const observacoes = (formData.get("observacoes") as string)?.trim() || null;
  const valorRaw = parseFloat(formData.get("valor") as string);
  const valor = isNaN(valorRaw) || valorRaw < 0 ? null : valorRaw;

  const servicosAdicionaisRaw = (formData.get("servicos_adicionais") as string)?.trim() || "[]";
  let servicosAdicionaisParsed: unknown[] = [];
  try { servicosAdicionaisParsed = JSON.parse(servicosAdicionaisRaw); } catch { servicosAdicionaisParsed = []; }
  if (!Array.isArray(servicosAdicionaisParsed)) servicosAdicionaisParsed = [];

  const salao_id = await getSalaoId();
  if (!salao_id) redirect("/login");

  const supabase = await createClient();

  // Valida servicos_adicionais contra o DB — rejeita preços adulterados pelo client
  let servicos_adicionais: Array<{ id: string; nome: string; preco: number; duracao_min: number }> = [];
  if (servicosAdicionaisParsed.length > 0) {
    const ids = (servicosAdicionaisParsed as Array<{ id?: unknown }>)
      .map((s) => (typeof s?.id === "string" ? s.id : null))
      .filter(Boolean) as string[];
    if (ids.length > 0) {
      const { data: svcsDb } = await supabase
        .from("servicos")
        .select("id, nome, preco, duracao_min")
        .in("id", ids)
        .eq("salao_id", salao_id)
        .eq("ativo", true);
      if (svcsDb) {
        const dbMap = new Map(svcsDb.map((s) => [s.id, s]));
        servicos_adicionais = ids.map((id) => dbMap.get(id)).filter(Boolean) as typeof servicos_adicionais;
      }
    }
  }
  const { error } = await supabase
    .from("agendamentos")
    .update({ cliente_id, servico_id, profissional_id, data, hora, valor, status, forma_pagamento, observacoes, servicos_adicionais })
    .eq("id", id)
    .eq("salao_id", salao_id);

  if (error) {
    console.error("[atualizarAgendamento]", error.code, error.message);
    return { error: "Erro ao salvar. Tente novamente." };
  }

  if (status === "concluido" && valor !== null && valor > 0) {
    try {
      const [{ data: svcData }, { data: cliData }] = await Promise.all([
        supabase.from("servicos").select("nome").eq("id", servico_id).maybeSingle(),
        supabase.from("clientes").select("nome").eq("id", cliente_id).maybeSingle(),
      ]);
      const nomeServico = svcData?.nome ?? "Atendimento";
      const descricao = cliData?.nome ? `${nomeServico} — ${cliData.nome}` : nomeServico;
      await lancarConclusao(supabase, {
        agendamento_id: id,
        salao_id,
        valor,
        data,
        profissional_id,
        forma_pagamento: forma_pagamento ?? null,
        descricao,
      });
    } catch (e) {
      console.error("[atualizarAgendamento] lancarConclusao", e);
    }
  }

  redirect("/agendamentos?toast=atualizado");
}

export async function deletarAgendamento(id: string) {
  if (!id) return { error: "ID inválido." };

  const salao_id = await getSalaoId();
  if (!salao_id) redirect("/login");

  const supabase = await createClient();

  // Remove transação financeira vinculada, se existir
  await supabase.from("transacoes").delete().eq("agendamento_id", id).eq("salao_id", salao_id);

  const { error } = await supabase
    .from("agendamentos")
    .delete()
    .eq("id", id)
    .eq("salao_id", salao_id);

  if (error) {
    console.error("[deletarAgendamento]", error.code, error.message);
    return { error: "Erro ao excluir. Tente novamente." };
  }

  redirect("/agendamentos?toast=excluido");
}
