"use server";

import { createClient } from "@/lib/supabase/server";
import { getSalaoId } from "@/lib/supabase/salon";
import { redirect } from "next/navigation";

export async function atualizarProfissional(formData: FormData) {
  const id   = (formData.get("id") as string)?.trim();
  const nome = (formData.get("nome") as string)?.trim();
  if (!id)   return { error: "ID inválido." };
  if (!nome) return { error: "nome" };

  const comissaoRaw = formData.get("percentual_comissao") as string;
  const comissao = comissaoRaw !== "" ? Number(comissaoRaw) : null;
  if (comissao !== null && (isNaN(comissao) || comissao < 0 || comissao > 100))
    return { error: "percentual_comissao" };

  const especialidades = formData.getAll("especialidades") as string[];
  const salao_id = await getSalaoId();
  if (!salao_id) redirect("/login");

  const supabase = await createClient();
  const { error } = await supabase.from("profissionais").update({
    nome,
    cargo:               (formData.get("cargo") as string)?.trim()    || null,
    email:               (formData.get("email") as string)?.trim()    || null,
    telefone:            (formData.get("telefone") as string)?.trim() || null,
    percentual_comissao: comissao,
    periodo_fechamento:  (formData.get("periodo_fechamento") as string) || "mensal",
    especialidades:      especialidades.length > 0 ? especialidades : null,
  }).eq("id", id).eq("salao_id", salao_id);

  if (error) return { error: "Erro ao atualizar profissional. Tente novamente." };

  redirect("/profissionais?toast=atualizado");
}
