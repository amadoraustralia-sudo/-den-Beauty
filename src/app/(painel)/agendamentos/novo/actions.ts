"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function criarAgendamento(formData: FormData) {
  const supabase = await createClient();

  const cliente_id = formData.get("cliente_id") as string;
  const servico_id = formData.get("servico_id") as string;
  const profissional_id = formData.get("profissional_id") as string;
  const data = formData.get("data") as string;
  const hora = formData.get("hora") as string;
  const valor = Number(formData.get("valor"));
  const status = formData.get("status") as string;

  const { error } = await supabase.from("agendamentos").insert({
    cliente_id: cliente_id || null,
    servico_id: servico_id || null,
    profissional_id: profissional_id || null,
    data,
    hora,
    valor: valor || null,
    status,
  });

  if (error) throw new Error(error.message);

  redirect("/agendamentos");
}
