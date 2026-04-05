"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function criarLancamento(formData: FormData) {
  const tipo      = formData.get("tipo") as string;
  const descricao = (formData.get("descricao") as string)?.trim();
  const valor     = parseFloat((formData.get("valor") as string)?.replace(",", "."));
  const data      = formData.get("data") as string;
  const categoria = (formData.get("categoria") as string)?.trim() ?? null;

  if (!tipo || !descricao || isNaN(valor) || valor <= 0 || !data) {
    redirect("/financeiro/novo?erro=campos");
  }

  const supabase = await createClient();

  const { error } = await supabase.from("transacoes").insert({
    tipo,
    descricao,
    valor,
    data,
    categoria: categoria || null,
  });

  if (error) redirect("/financeiro/novo?erro=db");

  redirect("/financeiro");
}
