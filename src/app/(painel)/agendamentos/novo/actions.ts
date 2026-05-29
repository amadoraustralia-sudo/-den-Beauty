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

export async function criarAgendamento(formData: FormData) {
  const cliente_id  = (formData.get("cliente_id") as string)?.trim();
  const servico_id  = (formData.get("servico_id") as string)?.trim();
  const data        = (formData.get("data") as string)?.trim();
  const hora        = (formData.get("hora") as string)?.trim();
  const statusRaw   = (formData.get("status") as string)?.trim() || "aguardando";
  const pagamentoRaw = (formData.get("forma_pagamento") as string)?.trim() || null;

  // Validações de presença
  if (!cliente_id) return { error: "cliente_id" };
  if (!servico_id) return { error: "servico_id" };
  if (!data)       return { error: "data" };
  if (!hora)       return { error: "hora" };

  // Validações de formato e enum
  if (!DATE_REGEX.test(data))                       return { error: "data" };
  if (!TIME_REGEX.test(hora))                       return { error: "hora" };
  if (!STATUS_VALIDOS.includes(statusRaw as StatusValido)) return { error: "status" };

  const status = statusRaw as StatusValido;

  if (status === "concluido" && !pagamentoRaw) return { error: "forma_pagamento" };
  if (pagamentoRaw && !PAGAMENTO_VALIDOS.includes(pagamentoRaw as PagamentoValido)) {
    return { error: "forma_pagamento" };
  }
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
  const { error } = await supabase.from("agendamentos").insert({
    cliente_id,
    servico_id,
    profissional_id,
    data,
    hora,
    valor,
    status,
    forma_pagamento,
    observacoes,
    salao_id,
    origem: "admin",
    servicos_adicionais,
  });

  if (error) {
    console.error("[criarAgendamento]", error.code, error.message);
    return { error: "Erro ao criar agendamento. Tente novamente." };
  }

  // Lançamento financeiro automático se criado já como concluido
  if (status === "concluido" && valor !== null && valor > 0) {
    const { data: ag } = await supabase
      .from("agendamentos")
      .select("id, clientes(nome), servicos(nome)")
      .eq("salao_id", salao_id)
      .eq("cliente_id", cliente_id)
      .eq("servico_id", servico_id)
      .eq("data", data)
      .eq("hora", hora)
      .single();
    if (ag) {
      const svc = (Array.isArray(ag.servicos) ? ag.servicos[0] : ag.servicos) as { nome: string } | null;
      const cli = (Array.isArray(ag.clientes) ? ag.clientes[0] : ag.clientes) as { nome: string } | null;
      const descricao = svc?.nome
        ? (cli?.nome ? `${svc.nome} — ${cli.nome}` : svc.nome)
        : "Atendimento";
      await supabase.from("transacoes").upsert(
        {
          agendamento_id: ag.id,
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
    }
  }

  redirect("/agendamentos?toast=criado");
}
