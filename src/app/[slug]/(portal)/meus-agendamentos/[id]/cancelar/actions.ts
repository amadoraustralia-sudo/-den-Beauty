"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function cancelarAgendamento(formData: FormData) {
  const id   = formData.get("id") as string;
  const slug = formData.get("slug") as string;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${slug}/login`);

  // Resolve cliente no contexto do salão
  const { data: config } = await supabase
    .from("configuracoes").select("id").eq("slug", slug).single();
  if (!config) redirect(`/${slug}/meus-agendamentos`);

  const { data: cliente } = await supabase
    .from("clientes").select("id")
    .eq("auth_user_id", user.id).eq("salao_id", config.id).single();

  if (!cliente) redirect(`/${slug}/meus-agendamentos`);

  await supabase
    .from("agendamentos")
    .update({ status: "cancelado" })
    .eq("id", id)
    .eq("cliente_id", cliente.id)
    .eq("salao_id", config.id);

  redirect(`/${slug}/meus-agendamentos?toast=cancelado`);
}
