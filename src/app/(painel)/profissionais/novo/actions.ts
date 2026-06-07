"use server";

import { createClient } from "@/lib/supabase/server";
import { getSalaoId } from "@/lib/supabase/salon";
import { redirect } from "next/navigation";

export async function criarProfissional(formData: FormData) {
  const nome     = (formData.get("nome") as string)?.trim();
  const comissao = Number(formData.get("percentual_comissao") ?? 50);

  if (!nome) return { error: "nome" };
  if (isNaN(comissao) || comissao < 0 || comissao > 100) return { error: "percentual_comissao" };

  const especialidades = formData.getAll("especialidades") as string[];

  const salao_id = await getSalaoId();
  if (!salao_id) redirect("/login");

  const supabase = await createClient();
  const { error } = await supabase.from("profissionais").insert({
    nome,
    cargo:               (formData.get("cargo") as string)?.trim() || null,
    email:               (formData.get("email") as string)?.trim() || null,
    telefone:            (formData.get("telefone") as string)?.trim() || null,
    percentual_comissao: comissao,
    periodo_fechamento:  (formData.get("periodo_fechamento") as string) || "mensal",
    especialidades:      especialidades.length > 0 ? especialidades : null,
    ativo:               true,
    salao_id,
  });

  if (error) {
    console.error("[criarProfissional]", error.code, error.message);
    return { error: "Erro ao criar profissional. Tente novamente." };
  }

  redirect("/profissionais?toast=criado");
}
