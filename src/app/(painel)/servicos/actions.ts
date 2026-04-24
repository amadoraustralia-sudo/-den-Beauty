"use server";

import { createClient } from "@/lib/supabase/server";
import { getSalaoId } from "@/lib/supabase/salon";
import { revalidatePath } from "next/cache";

export async function toggleServicoAtivo(formData: FormData) {
  const id = (formData.get("id") as string)?.trim();
  const ativo = formData.get("ativo") === "true";

  if (!id) return;

  const salao_id = await getSalaoId();
  if (!salao_id) return;

  const supabase = await createClient();
  await supabase.from("servicos").update({ ativo }).eq("id", id).eq("salao_id", salao_id);

  revalidatePath("/servicos");
}
