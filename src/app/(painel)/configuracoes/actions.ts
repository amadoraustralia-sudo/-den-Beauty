"use server";

import { createClient } from "@/lib/supabase/server";
import { getSalon } from "@/lib/supabase/salon";
import { redirect } from "next/navigation";

export async function salvarLogoUrl(logoUrl: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };
  const { error } = await supabase
    .from("configuracoes")
    .update({ logo_url: logoUrl })
    .eq("owner_user_id", user.id);
  if (error) return { error: error.message };
  return {};
}

export async function salvarConfiguracoes(formData: FormData) {
  const nome               = (formData.get("nome_estabelecimento") as string)?.trim();
  const telefone           = (formData.get("telefone") as string)?.trim() ?? null;
  const email              = (formData.get("email") as string)?.trim() ?? null;
  const endereco           = (formData.get("endereco") as string)?.trim() ?? null;
  const logo_url           = (formData.get("logo_url") as string) || null;
  const horario_abertura   = (formData.get("horario_abertura") as string) || "09:00";
  const horario_fechamento = (formData.get("horario_fechamento") as string) || "19:00";
  const intervalo          = parseInt(formData.get("intervalo_agendamento") as string) || 30;
  const antecedencia       = parseInt(formData.get("antecedencia_minima_horas") as string) || 2;
  const cancelamento       = parseInt(formData.get("cancelamento_horas") as string) || 24;

  const diasKeys = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"];

  const horarios_semana: Record<string, object> = {};
  for (const d of diasKeys) {
    const ativo = formData.get(`horario_${d}_ativo`) === "on";
    const abre  = (formData.get(`horario_${d}_abre`)  as string) || null;
    const fecha = (formData.get(`horario_${d}_fecha`) as string) || null;
    const int_inicio = (formData.get(`horario_${d}_int_inicio`) as string) || null;
    const int_fim    = (formData.get(`horario_${d}_int_fim`)    as string) || null;
    horarios_semana[d] = {
      ativo,
      ...(abre  ? { abre }  : {}),
      ...(fecha ? { fecha } : {}),
      ...(int_inicio && int_fim ? { intervalo_inicio: int_inicio, intervalo_fim: int_fim } : {}),
    };
  }

  const dias_funcionamento = diasKeys.filter((d) => (horarios_semana[d] as { ativo: boolean }).ativo);

  if (!nome) redirect("/configuracoes?erro=nome");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const salon = await getSalon();

  if (salon?.id) {
    await supabase.from("configuracoes").update({
      nome_estabelecimento: nome,
      telefone: telefone || null,
      email: email || null,
      endereco: endereco || null,
      logo_url,
      horario_abertura,
      horario_fechamento,
      dias_funcionamento,
      horarios_semana,
      intervalo_agendamento: intervalo,
      antecedencia_minima_horas: antecedencia,
      cancelamento_horas: cancelamento,
      updated_at: new Date().toISOString(),
    }).eq("id", salon.id);
  } else {
    // Primeiro acesso: cria configuracoes vinculada ao dono
    const slug = nome
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "").trim()
      .replace(/\s+/g, "-").slice(0, 50)
      + "-" + Math.random().toString(36).slice(2, 6);

    await supabase.from("configuracoes").insert({
      nome_estabelecimento: nome,
      telefone: telefone || null,
      email: email || null,
      endereco: endereco || null,
      logo_url,
      horario_abertura,
      horario_fechamento,
      dias_funcionamento,
      intervalo_agendamento: intervalo,
      antecedencia_minima_horas: antecedencia,
      cancelamento_horas: cancelamento,
      owner_user_id: user.id,
      slug,
    });
  }

  redirect("/configuracoes?toast=saved");
}
