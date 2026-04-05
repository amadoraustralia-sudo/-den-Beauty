"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function criarServico(formData: FormData) {
  const supabase = await createClient();

  const nome = formData.get("nome") as string;
  const categoria = formData.get("categoria") as string;
  const duracao_min = Number(formData.get("duracao_min"));
  const preco = Number(formData.get("preco"));

  const { error } = await supabase.from("servicos").insert({ nome, categoria, duracao_min, preco });

  if (error) throw new Error(error.message);

  redirect("/servicos");
}
