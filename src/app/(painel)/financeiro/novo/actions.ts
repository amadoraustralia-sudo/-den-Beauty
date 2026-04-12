"use server";

import { createClient } from "@/lib/supabase/server";
import { getSalaoId } from "@/lib/supabase/salon";
import { redirect } from "next/navigation";

export async function criarLancamento(formData: FormData) {
  const tipo      = (formData.get("tipo") as string)?.trim();
  const descricao = (formData.get("descricao") as string)?.trim();
  const valor     = parseFloat((formData.get("valor") as string)?.replace(",", "."));
  const data      = (formData.get("data") as string)?.trim();
  const categoria = (formData.get("categoria") as string)?.trim() || null;

  const erros: string[] = [];
  if (!tipo)                        erros.push("tipo");
  if (!descricao)                   erros.push("descricao");
  if (isNaN(valor) || valor <= 0)   erros.push("valor");
  if (!data)                        erros.push("data");

  if (erros.length > 0) {
    redirect(`/financeiro/novo?erros=${erros.join(",")}`);
  }

  const salao_id = await getSalaoId();
  if (!salao_id) redirect("/login");

  const supabase = await createClient();
  const { error } = await supabase.from("transacoes").insert({
    tipo, descricao, valor, data, categoria, salao_id,
  });

  if (error) redirect(`/financeiro/novo?erro=db&msg=${encodeURIComponent(error.message)}`);

  redirect("/financeiro?toast=criado");
}
