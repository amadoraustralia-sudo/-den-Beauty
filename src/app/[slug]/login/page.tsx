"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? `/${slug}/inicio`;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError || !data.user) {
      setError("E-mail ou senha incorretos.");
      setLoading(false);
      return;
    }

    // Se for admin, redireciona para o painel
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profile?.role === "admin") {
      router.push("/dashboard");
    } else {
      router.push(redirectTo);
    }
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "#F5F0E8" }}>
      <div className="w-full max-w-sm">
        <Link href={`/${slug}`} className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--brand-800)" }}>
            <span className="text-sm font-bold text-white">SB</span>
          </div>
          <span className="font-bold tracking-wide" style={{ color: "var(--brand-800)", fontSize: "1rem" }}>Salão de Beleza</span>
        </Link>

        <div className="rounded-2xl p-6 shadow-sm" style={{ background: "white", border: "1px solid var(--border)" }}>
          <div className="mb-6">
            <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)" }}>Entrar na sua conta</h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Acesse seus agendamentos e histórico</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label">E-mail</label>
              <input type="email" required autoComplete="email"
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com" className="input" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label" style={{ marginBottom: 0 }}>Senha</label>
                <Link href="/recuperar-senha" className="text-xs" style={{ color: "var(--brand-600)" }}>
                  Esqueci a senha
                </Link>
              </div>
              <input type="password" required autoComplete="current-password"
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" className="input" />
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm" style={{ background: "var(--danger-bg)", color: "var(--danger)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary w-full"
              style={{ padding: "0.75rem", backgroundColor: "var(--brand-800)", borderColor: "var(--brand-800)" }}>
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <div className="mt-5 pt-5 text-center" style={{ borderTop: "1px solid var(--border)" }}>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Primeira vez aqui?{" "}
              <Link href={`/${slug}/cadastro`} style={{ color: "var(--brand-600)", fontWeight: 600 }}>
                Criar conta grátis
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "var(--text-muted)" }}>
          Sou gestor do salão →{" "}
          <Link href="/login" style={{ color: "var(--brand-600)" }}>Área admin</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
