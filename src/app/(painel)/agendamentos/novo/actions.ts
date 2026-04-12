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
  const valorRaw = parseFloat(formData.get("valor") as string);
  const valor = isNaN(valorRaw) || valorRaw < 0 ? null : valorRaw;

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
    salao_id,
    origem: "admin",
  });

  // Nunca expor detalhes internos do banco ao cliente
  if (error) return { error: "Erro ao criar agendamento. Tente novamente." };

  redirect("/agendamentos?toast=criado");
}
