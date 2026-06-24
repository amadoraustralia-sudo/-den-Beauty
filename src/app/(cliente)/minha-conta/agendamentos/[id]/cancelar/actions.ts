"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function cancelarAgendamento(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) redirect("/minha-conta/agendamentos");

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: cliente } = await supabase
    .from("clientes")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!cliente) redirect("/minha-conta/agendamentos");

  // Verifica que o agendamento pertence ao cliente e pode ser cancelado
  const { data: agendamento } = await supabase
    .from("agendamentos")
    .select("id, status")
    .eq("id", id)
    .eq("cliente_id", cliente.id)
    .single();

  if (!agendamento || agendamento.status === "cancelado" || agendamento.status === "concluido") {
    redirect("/minha-conta/agendamentos");
  }

  const { data: updated } = await supabase
    .from("agendamentos")
    .update({ status: "cancelado" })
    .eq("id", id)
    .eq("cliente_id", cliente.id)
    .select("id")
    .single();

  if (!updated) redirect("/minha-conta/agendamentos");

  redirect("/minha-conta/agendamentos");
}
