"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function generateSlug(nome: string): string {
  const base = nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 45);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

/** Chamada após login para completar a criação do salão caso ainda não exista */
export async function completarCadastroSalao(nomeSalao: string, telefone?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verifica se já tem salão
  const { data: existing } = await supabase
    .from("configuracoes")
    .select("id")
    .eq("owner_user_id", user.id)
    .single();

  if (existing) return { salaoId: existing.id };

  const slug = generateSlug(nomeSalao);

  const { data: salon, error } = await supabase
    .from("configuracoes")
    .insert({
      nome_estabelecimento: nomeSalao.trim(),
      telefone: telefone?.trim() || null,
      slug,
      owner_user_id: user.id,
      horario_abertura: "09:00",
      horario_fechamento: "19:00",
      dias_funcionamento: ["seg", "ter", "qua", "qui", "sex", "sab"],
      intervalo_agendamento: 30,
      antecedencia_minima_horas: 2,
      cancelamento_horas: 24,
    })
    .select("id")
    .single();

  if (error || !salon) {
    console.error("[completarCadastroSalao] insert error:", error);
    return { error: error?.message ?? "Erro ao criar salão. Tente novamente." };
  }

  // Vincula o salão ao profile
  await supabase
    .from("profiles")
    .update({ salao_id: salon.id })
    .eq("id", user.id);

  return { salaoId: salon.id };
}
