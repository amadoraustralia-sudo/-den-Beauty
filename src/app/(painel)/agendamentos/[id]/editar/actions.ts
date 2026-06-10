"use server";

import { createClient } from "@/lib/supabase/server";
import { getSalaoId } from "@/lib/supabase/salon";
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
  let servicos_adicionais: unknown[] = [];
  try { servicos_adicionais = JSON.parse(servicosAdicionaisRaw); } catch { servicos_adicionais = []; }
  if (!Array.isArray(servicos_adicionais)) servicos_adicionais = [];

  const salao_id = await getSalaoId();
  if (!salao_id) redirect("/login");

  const supabase = await createClient();
  const { error } = await supabase
    .from("agendamentos")
    .update({ cliente_id, servico_id, profissional_id, data, hora, valor, status, forma_pagamento, observacoes, servicos_adicionais })
    .eq("id", id)
    .eq("salao_id", salao_id);

  if (error) {
    console.error("[atualizarAgendamento]", error.code, error.message);
    return { error: "Erro ao salvar. Tente novamente." };
  }

  // Lançamentos automáticos ao concluir
  if (status === "concluido" && valor !== null && valor > 0) {
    const { data: meta } = await supabase
      .from("agendamentos")
      .select("clientes(nome), servicos(nome)")
      .eq("id", id)
      .single();
    const svc = meta ? (Array.isArray(meta.servicos) ? meta.servicos[0] : meta.servicos) as { nome: string } | null : null;
    const cli = meta ? (Array.isArray(meta.clientes) ? meta.clientes[0] : meta.clientes) as { nome: string } | null : null;
    const descricao = svc?.nome
      ? (cli?.nome ? `${svc.nome} — ${cli.nome}` : svc.nome)
      : "Atendimento";

    await supabase.from("transacoes").upsert(
      {
        agendamento_id: id,
        tipo: "entrada",
        descricao,
        valor,
        data: data,
        categoria: "Serviço",
        salao_id,
        forma_pagamento: forma_pagamento ?? null,
      },
      { onConflict: "agendamento_id" }
    );

    // Comissão do profissional (estava ausente neste fluxo)
    if (profissional_id) {
      const { data: prof } = await supabase
        .from("profissionais")
        .select("percentual_comissao")
        .eq("id", profissional_id)
        .single();

      const percentual = Number(prof?.percentual_comissao ?? 0);
      if (percentual > 0) {
        await supabase.from("comissoes").upsert(
          {
            agendamento_id: id,
            profissional_id,
            valor_servico: valor,
            percentual,
            valor_comissao: valor * (percentual / 100),
            data: data,
            salao_id,
          },
          { onConflict: "agendamento_id" }
        );
      }
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
