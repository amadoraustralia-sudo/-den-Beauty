"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function assertSuperAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "super_admin") redirect("/admin");
  return supabase;
}

export async function toggleSalaoAtivo(salaoId: string, ativo: boolean) {
  const supabase = await assertSuperAdmin();
  await supabase.from("configuracoes").update({ ativo }).eq("id", salaoId);
  revalidatePath("/admin/saloes");
  revalidatePath(`/admin/saloes/${salaoId}`);
}

export async function deletarSalao(salaoId: string) {
  const supabase = await assertSuperAdmin();
  // Deleta na ordem correta para respeitar FKs
  await supabase.from("comissoes").delete().eq("salao_id", salaoId);
  await supabase.from("transacoes").delete().eq("salao_id", salaoId);
  await supabase.from("horarios_bloqueados").delete().eq("salao_id", salaoId);
  await supabase.from("agendamentos").delete().eq("salao_id", salaoId);
  await supabase.from("clientes").delete().eq("salao_id", salaoId);
  await supabase.from("servicos").delete().eq("salao_id", salaoId);
  await supabase.from("profissionais").delete().eq("salao_id", salaoId);
  await supabase.from("profiles").update({ salao_id: null }).eq("salao_id", salaoId);
  await supabase.from("configuracoes").delete().eq("id", salaoId);
  revalidatePath("/admin/saloes");
  redirect("/admin/saloes");
}
