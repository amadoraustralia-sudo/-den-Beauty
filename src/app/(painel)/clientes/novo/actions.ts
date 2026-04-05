"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function criarCliente(formData: FormData) {
  const supabase = await createClient();

  const dados = {
    nome:                     formData.get("nome") as string,
    telefone:                 formData.get("telefone") as string || null,
    email:                    formData.get("email") as string || null,
    data_nascimento:          formData.get("data_nascimento") as string || null,
    alergias:                 formData.get("alergias") as string || null,
    preferencias:             formData.get("preferencias") as string || null,
    profissional_preferido_id:formData.get("profissional_preferido_id") as string || null,
  };

  const { error } = await supabase.from("clientes").insert(dados);
  if (error) throw new Error(error.message);

  redirect("/clientes");
}
