"use server";

import { createClient } from "@/lib/supabase/server";
import { getSalaoId } from "@/lib/supabase/salon";
import { redirect } from "next/navigation";

const TIPOS_VALIDOS = ["entrada", "saida"] as const;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
type TipoValido = typeof TIPOS_VALIDOS[number];

export async function atualizarTransacao(formData: FormData) {
  const id        = (formData.get("id") as string)?.trim();
  const tipoRaw   = (formData.get("tipo") as string)?.trim();
  const descricao = (formData.get("descricao") as string)?.trim();
  const valor     = parseFloat((formData.get("valor") as string)?.replace(",", "."));
  const data      = (formData.get("data") as string)?.trim();
  const categoria = (formData.get("categoria") as string)?.trim() || null;

  const erros: string[] = [];
  if (!id)                                                          erros.push("id");
  if (!tipoRaw || !TIPOS_VALIDOS.includes(tipoRaw as TipoValido))  erros.push("tipo");
  if (!descricao)                                                   erros.push("descricao");
  if (isNaN(valor) || valor <= 0)                                   erros.push("valor");
  if (!data || !DATE_REGEX.test(data))                              erros.push("data");

  if (erros.length > 0) {
    redirect(`/financeiro/${id}/editar?erros=${erros.join(",")}`);
  }

  const tipo = tipoRaw as TipoValido;
  const salao_id = await getSalaoId();
  if (!salao_id) redirect("/login");

  const supabase = await createClient();
  const { error } = await supabase
    .from("transacoes")
    .update({ tipo, descricao, valor, data, categoria })
    .eq("id", id)
    .eq("salao_id", salao_id);

  if (error) redirect(`/financeiro/${id}/editar?erro=db`);
  redirect("/financeiro?toast=atualizado");
}

export async function excluirTransacao(formData: FormData) {
  const id = (formData.get("id") as string)?.trim();
  if (!id) redirect("/financeiro");

  const salao_id = await getSalaoId();
  if (!salao_id) redirect("/login");

  const supabase = await createClient();
  await supabase.from("transacoes").delete().eq("id", id).eq("salao_id", salao_id);
  redirect("/financeiro?toast=excluido");
}
