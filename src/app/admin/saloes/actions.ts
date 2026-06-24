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
  const { error } = await supabase.rpc("deletar_salao", { p_salao_id: salaoId });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/saloes");
  redirect("/admin/saloes");
}
