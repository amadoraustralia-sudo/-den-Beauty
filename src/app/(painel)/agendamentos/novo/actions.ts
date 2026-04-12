"use server";

import { createClient } from "@/lib/supabase/server";
import { getSalaoId } from "@/lib/supabase/salon";
import { redirect } from "next/navigation";

export async function criarAgendamento(formData: FormData) {
  const cliente_id  = (formData.get("cliente_id") as string)?.trim();
  const servico_id  = (formData.get("servico_id") as string)?.trim();
  const data        = (formData.get("data") as string)?.trim();
  const hora        = (formData.get("hora") as string)?.trim();
  const status      = (formData.get("status") as string) || "aguardando";
  const forma_pagamento = (formData.get("forma_pagamento") as string) || null;

  if (!cliente_id) return { error: "cliente_id" };
  if (!servico_id) return { error: "servico_id" };
  if (!data)       return { error: "data" };
  if (!hora)       return { error: "hora" };
  if (status === "concluido" && !forma_pagamento) return { error: "forma_pagamento" };

  const profissional_id = (formData.get("profissional_id") as string) || null;
  const valor           = parseFloat(formData.get("valor") as string) || null;

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

  if (error) return { error: `db:${error.message}` };

  redirect("/agendamentos?toast=criado");
}
