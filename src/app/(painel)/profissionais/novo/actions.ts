"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function criarProfissional(formData: FormData) {
  const supabase = await createClient();

  const especialidades = formData.getAll("especialidades") as string[];

  const dados = {
    nome:                formData.get("nome") as string,
    cargo:               formData.get("cargo") as string || null,
    email:               formData.get("email") as string || null,
    percentual_comissao: Number(formData.get("percentual_comissao") ?? 50),
    periodo_fechamento:  formData.get("periodo_fechamento") as string || "mensal",
    especialidades:      especialidades.length > 0 ? especialidades : null,
    ativo:               true,
  };

  const { error } = await supabase.from("profissionais").insert(dados);
  if (error) throw new Error(error.message);

  redirect("/profissionais");
}
