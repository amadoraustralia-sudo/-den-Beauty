"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function criarAgendamento(formData: FormData) {
  const cliente_id  = (formData.get("cliente_id") as string)?.trim();
  const servico_id  = (formData.get("servico_id") as string)?.trim();
  const data        = (formData.get("data") as string)?.trim();
  const hora        = (formData.get("hora") as string)?.trim();

  const erros: string[] = [];
  if (!cliente_id) erros.push("cliente_id");
  if (!servico_id) erros.push("servico_id");
  if (!data)       erros.push("data");
  if (!hora)       erros.push("hora");

  if (erros.length > 0) {
    redirect(`/agendamentos/novo?erros=${erros.join(",")}`);
  }

  const profissional_id  = (formData.get("profissional_id") as string) || null;
  const valor            = parseFloat(formData.get("valor") as string) || null;
  const status           = (formData.get("status") as string) || "aguardando";
  const forma_pagamento  = (formData.get("forma_pagamento") as string) || null;

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
  });

  if (error) redirect(`/agendamentos/novo?erro=db&msg=${encodeURIComponent(error.message)}`);

  redirect("/agendamentos?toast=criado");
}
