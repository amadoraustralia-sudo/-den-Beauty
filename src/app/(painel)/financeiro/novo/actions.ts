"use server";

import { createClient } from "@/lib/supabase/server";
import { getSalaoId } from "@/lib/supabase/salon";
import { redirect } from "next/navigation";

const TIPOS_VALIDOS = ["entrada", "saida"] as const;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

type TipoValido = typeof TIPOS_VALIDOS[number];

export async function criarLancamento(formData: FormData) {
  const tipoRaw   = (formData.get("tipo") as string)?.trim();
  const descricao = (formData.get("descricao") as string)?.trim();
  const valor     = parseFloat((formData.get("valor") as string)?.replace(",", "."));
  const data      = (formData.get("data") as string)?.trim();
  const categoria = (formData.get("categoria") as string)?.trim() || null;

  const erros: string[] = [];
  if (!tipoRaw || !TIPOS_VALIDOS.includes(tipoRaw as TipoValido)) erros.push("tipo");
  if (!descricao)                                                   erros.push("descricao");
  if (isNaN(valor) || valor <= 0)                                   erros.push("valor");
  if (!data || !DATE_REGEX.test(data))                              erros.push("data");

  if (erros.length > 0) {
    const params = new URLSearchParams();
    params.set("erros", erros.join(","));
    if (tipoRaw) params.set("tipo", tipoRaw);
    const desc = (formData.get("descricao") as string)?.trim();
    const val  = (formData.get("valor") as string)?.trim();
    const dat  = (formData.get("data") as string)?.trim();
    if (desc) params.set("descricao", desc);
    if (val)  params.set("valor", val);
    if (dat)  params.set("data", dat);
    redirect(`/financeiro/novo?${params.toString()}`);
  }

  const tipo = tipoRaw as TipoValido;

  const salao_id = await getSalaoId();
  if (!salao_id) redirect("/login");

  const supabase = await createClient();
  const { error } = await supabase.from("transacoes").insert({
    tipo, descricao, valor, data, categoria, salao_id,
  });

  if (error) redirect("/financeiro/novo?erro=db");

  redirect("/financeiro?toast=criado");
}
