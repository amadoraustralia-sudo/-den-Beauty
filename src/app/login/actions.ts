"use server";

import { createClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function signIn(formData: FormData) {
  const email    = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) return { error: "Preencha todos os campos." };

  const ip = getClientIp(await headers());
  const limit = rateLimit(ip, "login", 30, 60);
  if (!limit.ok) {
    return { error: "Muitas tentativas. Aguarde alguns instantes e tente novamente." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return { error: "E-mail ou senha incorretos." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  const customRedirect = (formData.get("redirect") as string | null)?.trim();

  if (profile?.role === "super_admin") {
    return { redirectTo: "/admin" };
  } else if (profile?.role === "cliente") {
    return { redirectTo: customRedirect || "/minha-conta" };
  } else {
    return { redirectTo: "/dashboard" };
  }
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function resetPassword(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  if (!email) return { error: "Informe seu e-mail." };

  const ip = getClientIp(await headers());
  const limit = rateLimit(ip, "reset-password", 3, 300);
  if (!limit.ok) {
    return { error: "Muitas tentativas. Aguarde 5 minutos antes de solicitar novamente." };
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/redefinir-senha`,
  });

  return { ok: true };
}
