"use server";

import { createClient } from "@/lib/supabase/server";
import { getSalaoId } from "@/lib/supabase/salon";
import { redirect } from "next/navigation";

export async function atualizarServico(formData: FormData) {
  const id         = (formData.get("id") as string)?.trim();
  const nome       = (formData.get("nome") as string)?.trim();
  const categoria  = (formData.get("categoria") as string)?.trim();
  const duracao_min = Number(formData.get("duracao_min"));
  const preco      = parseFloat((formData.get("preco") as string)?.replace(",", "."));
  const descricao  = (formData.get("descricao") as string)?.trim() || null;
  const ativo      = formData.get("ativo") === "true";

  if (!id || !nome || !categoria)              return { error: "Campos obrigatórios ausentes." };
  if (!duracao_min || duracao_min < 1)         return { error: "duracao_min" };
  if (isNaN(preco) || preco < 0)               return { error: "preco" };

  const salao_id = await getSalaoId();
  if (!salao_id) redirect("/login");

  const supabase = await createClient();
  const { error } = await supabase
    .from("servicos")
    .update({ nome, categoria, duracao_min, preco, descricao, ativo })
    .eq("id", id)
    .eq("salao_id", salao_id);

  if (error) return { error: "Erro ao salvar. Tente novamente." };

  redirect("/servicos?toast=atualizado");
}
