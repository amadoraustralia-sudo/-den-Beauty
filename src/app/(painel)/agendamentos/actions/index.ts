"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const STATUS_VALIDOS = ["aguardando", "confirmado", "concluido", "cancelado"] as const;
type StatusValido = typeof STATUS_VALIDOS[number];

export async function atualizarStatusAgendamento(id: string, status: StatusValido) {
  if (!STATUS_VALIDOS.includes(status)) return;

  const supabase = await createClient();
  await supabase.from("agendamentos").update({ status }).eq("id", id);
  revalidatePath("/agendamentos");
  revalidatePath("/dashboard");
}
