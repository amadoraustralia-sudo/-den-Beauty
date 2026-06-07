"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function atualizarPerfil(formData: FormData) {
  const nome = (formData.get("nome") as string)?.trim();
  const telefone = (formData.get("telefone") as string)?.trim() ?? null;

  if (!nome) redirect("/minha-conta/perfil");

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Usa auth_user_id (UUID único e imutável) em vez de email
  // Isso evita race conditions e garante que o update só afeta o próprio registro
  const { error } = await supabase
    .from("clientes")
    .update({ nome, telefone: telefone || null })
    .eq("auth_user_id", user.id);

  if (error) redirect("/minha-conta/perfil?error=1");

  redirect("/minha-conta/perfil?saved=1");
}
