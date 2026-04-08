"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function criarProfissional(formData: FormData) {
  const nome     = (formData.get("nome") as string)?.trim();
  const comissao = Number(formData.get("percentual_comissao") ?? 50);

  const erros: string[] = [];
  if (!nome)                              erros.push("nome");
  if (isNaN(comissao) || comissao < 0 || comissao > 100) erros.push("percentual_comissao");

  if (erros.length > 0) {
    redirect(`/profissionais/novo?erros=${erros.join(",")}`);
  }

  const especialidades = formData.getAll("especialidades") as string[];

  const dados = {
    nome,
    cargo:               (formData.get("cargo") as string)?.trim() || null,
    email:               (formData.get("email") as string)?.trim() || null,
    telefone:            (formData.get("telefone") as string)?.trim() || null,
    percentual_comissao: comissao,
    periodo_fechamento:  (formData.get("periodo_fechamento") as string) || "mensal",
    especialidades:      especialidades.length > 0 ? especialidades : null,
    ativo:               true,
  };

  const supabase = await createClient();
  const { error } = await supabase.from("profissionais").insert(dados);

  if (error) redirect(`/profissionais/novo?erro=db&msg=${encodeURIComponent(error.message)}`);

  redirect("/profissionais?toast=criado");
}
