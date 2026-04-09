"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function criarServico(formData: FormData) {
  const nome        = (formData.get("nome") as string)?.trim();
  const categoria   = (formData.get("categoria") as string)?.trim();
  const duracao_min = Number(formData.get("duracao_min"));
  const preco       = parseFloat((formData.get("preco") as string)?.replace(",", "."));
  const descricao   = (formData.get("descricao") as string)?.trim() || null;

  if (!nome)                           return { error: "nome" };
  if (!categoria)                      return { error: "categoria" };
  if (!duracao_min || duracao_min < 1) return { error: "duracao_min" };
  if (isNaN(preco) || preco < 0)       return { error: "preco" };

  const supabase = await createClient();
  const { error } = await supabase.from("servicos").insert({
    nome, categoria, duracao_min, preco, descricao, ativo: true,
  });

  if (error) return { error: `db:${error.message}` };

  redirect("/servicos?toast=criado");
}
