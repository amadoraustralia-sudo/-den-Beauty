"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function criarCliente(formData: FormData) {
  const nome = (formData.get("nome") as string)?.trim();
  if (!nome) return { error: "O nome é obrigatório." };

  const supabase = await createClient();
  const { error } = await supabase.from("clientes").insert({
    nome,
    telefone:                  (formData.get("telefone") as string)?.trim() || null,
    email:                     (formData.get("email") as string)?.trim() || null,
    data_nascimento:           (formData.get("data_nascimento") as string) || null,
    alergias:                  (formData.get("alergias") as string)?.trim() || null,
    preferencias:              (formData.get("preferencias") as string)?.trim() || null,
    profissional_preferido_id: (formData.get("profissional_preferido_id") as string) || null,
  });

  if (error) return { error: error.message };

  redirect("/clientes?toast=criado");
}
