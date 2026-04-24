"use server";

import { createClient } from "@/lib/supabase/server";
import { getSalaoId } from "@/lib/supabase/salon";
import { redirect } from "next/navigation";

export async function atualizarCliente(formData: FormData) {
  const id   = (formData.get("id") as string)?.trim();
  const nome = (formData.get("nome") as string)?.trim();
  if (!id)   return { error: "ID inválido." };
  if (!nome) return { error: "O nome é obrigatório." };

  const salao_id = await getSalaoId();
  if (!salao_id) redirect("/login");

  const supabase = await createClient();
  const { error } = await supabase.from("clientes").update({
    nome,
    telefone:                  (formData.get("telefone") as string)?.trim() || null,
    email:                     (formData.get("email") as string)?.trim()    || null,
    data_nascimento:           (formData.get("data_nascimento") as string)  || null,
    alergias:                  (formData.get("alergias") as string)?.trim() || null,
    preferencias:              (formData.get("preferencias") as string)?.trim() || null,
    profissional_preferido_id: (formData.get("profissional_preferido_id") as string) || null,
  }).eq("id", id).eq("salao_id", salao_id);

  if (error) return { error: "Erro ao atualizar cliente. Tente novamente." };

  redirect(`/clientes/${id}?toast=atualizado`);
}
