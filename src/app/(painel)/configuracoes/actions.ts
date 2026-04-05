"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function salvarConfiguracoes(formData: FormData) {
  const nome               = (formData.get("nome_estabelecimento") as string)?.trim();
  const telefone           = (formData.get("telefone") as string)?.trim() ?? null;
  const email              = (formData.get("email") as string)?.trim() ?? null;
  const endereco           = (formData.get("endereco") as string)?.trim() ?? null;
  const horario_abertura   = (formData.get("horario_abertura") as string) || "09:00";
  const horario_fechamento = (formData.get("horario_fechamento") as string) || "19:00";
  const intervalo          = parseInt(formData.get("intervalo_agendamento") as string) || 30;
  const antecedencia       = parseInt(formData.get("antecedencia_minima_horas") as string) || 2;
  const cancelamento       = parseInt(formData.get("cancelamento_horas") as string) || 24;

  const diasCheck = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"];
  const dias_funcionamento = diasCheck.filter((d) => formData.get(`dia_${d}`) === "on");

  if (!nome) redirect("/configuracoes?erro=nome");

  const supabase = await createClient();

  const { data: existing } = await supabase.from("configuracoes").select("id").limit(1).single();

  if (existing?.id) {
    await supabase.from("configuracoes").update({
      nome_estabelecimento: nome,
      telefone: telefone || null,
      email: email || null,
      endereco: endereco || null,
      horario_abertura,
      horario_fechamento,
      dias_funcionamento,
      intervalo_agendamento: intervalo,
      antecedencia_minima_horas: antecedencia,
      cancelamento_horas: cancelamento,
      updated_at: new Date().toISOString(),
    }).eq("id", existing.id);
  } else {
    await supabase.from("configuracoes").insert({
      nome_estabelecimento: nome,
      telefone: telefone || null,
      email: email || null,
      endereco: endereco || null,
      horario_abertura,
      horario_fechamento,
      dias_funcionamento,
      intervalo_agendamento: intervalo,
      antecedencia_minima_horas: antecedencia,
      cancelamento_horas: cancelamento,
    });
  }

  redirect("/configuracoes?salvo=1");
}
