"use server";

import { createClient } from "@/lib/supabase/server";
import { getSalon } from "@/lib/supabase/salon";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function adicionarDataFechada(formData: FormData): Promise<{ error?: string }> {
  const data = (formData.get("data") as string)?.trim();
  const motivo = (formData.get("motivo") as string)?.trim() || null;
  if (!data) return { error: "Data obrigatória" };

  const supabase = await createClient();
  const salon = await getSalon();
  if (!salon?.id) return { error: "Salão não encontrado" };

  const { error } = await supabase.from("horarios_bloqueados").insert({
    salao_id: salon.id,
    profissional_id: null,
    data,
    hora_inicio: "00:00",
    hora_fim: "23:59",
    motivo,
  });
  if (error) return { error: error.message };
  revalidatePath("/configuracoes");
  return {};
}

export async function removerDataFechada(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const salon = await getSalon();
  if (!salon?.id) return { error: "Salão não encontrado" };
  const { error } = await supabase
    .from("horarios_bloqueados")
    .delete()
    .eq("id", id)
    .eq("salao_id", salon.id)
    .is("profissional_id", null);
  if (error) return { error: error.message };
  revalidatePath("/configuracoes");
  return {};
}

export async function salvarLogoUrl(logoUrl: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };
  const { error } = await supabase
    .from("configuracoes")
    .update({ logo_url: logoUrl })
    .eq("owner_user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/configuracoes");
  return {};
}

/**
 * Normaliza o WhatsApp da gestora: só dígitos, remove o 55 colado, valida DDD+número
 * (10-11 dígitos) e devolve no formato canônico '55' + dígitos. Vazio → null.
 * Retorna { erro } quando o número é inválido.
 */
function normalizarWhatsappGestora(raw: string): { valor: string | null; erro?: string } {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (digits.length === 0) return { valor: null };
  let local = digits;
  if (local.length > 11 && local.startsWith("55")) local = local.slice(2);
  if (local.length < 10 || local.length > 11) return { valor: null, erro: "whatsapp" };
  return { valor: "55" + local };
}

/**
 * Dispara o webhook n8n de ativação da Eva. Best-effort: falha de rede NÃO quebra o save.
 * Retorna true se o n8n confirmou (2xx), false caso contrário (ou se envs faltando).
 */
async function dispararAtivacaoEva(payload: {
  salao_id: string;
  whatsapp: string;
  nome_salao: string;
  nome_gestora: string | null;
}): Promise<boolean> {
  const url = process.env.EVA_ACTIVATION_WEBHOOK_URL;
  const secret = process.env.EVA_WEBHOOK_SECRET;
  if (!url || !secret) return false;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Eva-Secret": secret },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
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

  const wpp = normalizarWhatsappGestora(formData.get("whatsapp_gestora") as string);
  if (wpp.erro) redirect("/configuracoes?erro=whatsapp");
  // Não deixa a gestora cadastrar o próprio número da instância (evita loop fromMe).
  const instancia = (process.env.EVA_INSTANCE_NUMBER ?? "").replace(/\D/g, "");
  if (wpp.valor && instancia && wpp.valor === instancia) {
    redirect("/configuracoes?erro=whatsapp_instancia");
  }

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

  // Detecta se o WhatsApp da gestora entrou/mudou para (re)ativar a Eva e avisar o n8n.
  const whatsappAtual: string | null = (salon as { whatsapp_gestora?: string | null })?.whatsapp_gestora ?? null;
  const numeroMudou = wpp.valor !== whatsappAtual;
  // Campos da Eva a gravar: n\u00famero vazio desliga; n\u00famero novo/alterado (re)liga; inalterado n\u00e3o mexe.
  const evaFields: Record<string, unknown> =
    wpp.valor === null
      ? { whatsapp_gestora: null, eva_ativa: false }
      : numeroMudou
        ? { whatsapp_gestora: wpp.valor, eva_ativa: true, eva_ativada_em: new Date().toISOString() }
        : {};

  let salaoId = salon?.id ?? null;

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
      ...evaFields,
    }).eq("id", salon.id);
  } else {
    // Primeiro acesso: cria configuracoes vinculada ao dono
    const slug = nome
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "").trim()
      .replace(/\s+/g, "-").slice(0, 50)
      + "-" + Math.random().toString(36).slice(2, 6);

    const { data: novo } = await supabase.from("configuracoes").insert({
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
      ...evaFields,
    }).select("id").single();
    salaoId = novo?.id ?? null;
  }

  // N\u00famero novo/alterado e n\u00e3o vazio \u2192 aciona a Eva no n8n. Falha do webhook n\u00e3o quebra o save.
  let toast = "saved";
  if (numeroMudou && wpp.valor && salaoId) {
    const ok = await dispararAtivacaoEva({
      salao_id: salaoId,
      whatsapp: wpp.valor,
      nome_salao: nome,
      nome_gestora: null,
    });
    if (!ok) toast = "eva_pendente";
  }

  redirect(`/configuracoes?toast=${toast}`);
}
