"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function cancelarAgendamento(formData: FormData) {
  const id   = formData.get("id") as string;
  const slug = formData.get("slug") as string;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${slug}/login`);

  const { data: configRows } = await supabase.rpc("get_configuracoes_portal", { p_slug: slug });
  const config = (configRows as any[])?.[0] ?? null;
  if (!config) redirect(`/${slug}/meus-agendamentos`);

  const { data: cliente } = await supabase
    .from("clientes").select("id")
    .eq("auth_user_id", user.id).eq("salao_id", config.id).maybeSingle();

  if (!cliente) redirect(`/${slug}/meus-agendamentos`);

  await supabase
    .from("agendamentos")
    .update({ status: "cancelado" })
    .eq("id", id)
    .eq("cliente_id", cliente.id)
    .eq("salao_id", config.id);

  redirect(`/${slug}/meus-agendamentos?toast=cancelado`);
}
