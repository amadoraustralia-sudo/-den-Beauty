"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function cancelarAgendamento(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) redirect("/agendar/meus-agendamentos");

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/agendar/login");

  // Resolve cliente por auth_user_id (preferencial) e cai para email
  let clienteId: string | null = null;
  const { data: c1 } = await supabase
    .from("clientes").select("id").eq("auth_user_id", user.id).maybeSingle();
  if (c1) clienteId = c1.id;
  else if (user.email) {
    const { data: c2 } = await supabase
      .from("clientes").select("id").eq("email", user.email).maybeSingle();
    if (c2) clienteId = c2.id;
  }
  if (!clienteId) redirect("/agendar/meus-agendamentos");

  // Verifica que o agendamento é do cliente e pode ser cancelado
  const { data: agendamento } = await supabase
    .from("agendamentos")
    .select("id, status")
    .eq("id", id)
    .eq("cliente_id", clienteId)
    .maybeSingle();

  if (!agendamento || agendamento.status === "cancelado" || agendamento.status === "concluido") {
    redirect("/agendar/meus-agendamentos");
  }

  // RLS: coberto pela policy "agendamentos_client_update_own" (C4)
  await supabase
    .from("agendamentos")
    .update({ status: "cancelado" })
    .eq("id", id)
    .eq("cliente_id", clienteId);

  redirect("/agendar/meus-agendamentos");
}
