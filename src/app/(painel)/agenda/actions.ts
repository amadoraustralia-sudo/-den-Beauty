"use server";

import { createClient } from "@/lib/supabase/server";
import { getSalaoId } from "@/lib/supabase/salon";
import { revalidatePath } from "next/cache";

export async function bloquearHorario(
  data: string,
  hora_inicio: string,
  hora_fim: string,
  profissional_id: string,
  motivo?: string
): Promise<{ error?: string; id?: string }> {
  const salao_id = await getSalaoId();
  if (!salao_id) return { error: "Não autenticado" };

  const supabase = await createClient();

  // Verifica que o profissional pertence ao salão do admin
  const { data: prof } = await supabase
    .from("profissionais")
    .select("id")
    .eq("id", profissional_id)
    .eq("salao_id", salao_id)
    .single();
  if (!prof) return { error: "Profissional não encontrado." };

  const { data: result, error } = await supabase
    .from("horarios_bloqueados")
    .insert({ salao_id, profissional_id, data, hora_inicio, hora_fim, motivo: motivo || null })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/agenda");
  return { id: result.id };
}

export async function desbloquearHorario(id: string): Promise<{ error?: string }> {
  const salao_id = await getSalaoId();
  if (!salao_id) return { error: "Não autenticado" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("horarios_bloqueados")
    .delete()
    .eq("id", id)
    .eq("salao_id", salao_id);

  if (error) return { error: error.message };
  revalidatePath("/agenda");
  return {};
}
