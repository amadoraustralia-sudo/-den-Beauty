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

  await supabase
    .from("clientes")
    .update({ nome, telefone: telefone || null })
    .eq("email", user.email!);

  redirect("/minha-conta/perfil?saved=1");
}
