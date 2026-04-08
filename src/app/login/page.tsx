"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("E-mail ou senha incorretos.");
      setLoading(false);
      return;
    }

    // Busca o role do usuário
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profile?.role === "cliente") {
      router.push("/minha-conta");
    } else {
      router.push("/dashboard");
    }
    router.refresh();
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: "var(--bg)" }}
    >
      {/* Painel lateral esquerdo */}
      <div
        className="hidden lg:flex lg:w-[420px] flex-col justify-between p-10 flex-shrink-0"
        style={{ backgroundColor: "var(--brand-800)" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--brand-400)" }}>
            <span className="text-xs font-bold" style={{ color: "white" }}>EB</span>
          </div>
          <span className="font-bold text-sm tracking-wide" style={{ color: "white" }}>Éden Beauty</span>
        </div>

        <div>
          <blockquote className="space-y-3">
            <p className="text-xl font-medium leading-relaxed" style={{ color: "var(--text-inverse)" }}>
              "Organização que libera tempo para o que realmente importa: o seu cliente."
            </p>
            <footer className="text-sm" style={{ color: "rgb(255 255 255 / 0.45)" }}>
              Gestão inteligente para salões e barbearias
            </footer>
          </blockquote>
        </div>

        <div className="space-y-3">
          {[
            { n: "248", label: "Atendimentos este mês" },
            { n: "94%", label: "Taxa de retorno de clientes" },
            { n: "8 min", label: "Para configurar do zero" },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-3">
              <span className="text-lg font-bold" style={{ color: "var(--brand-300)" }}>{stat.n}</span>
              <span className="text-sm" style={{ color: "rgb(255 255 255 / 0.45)" }}>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Formulário */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--brand-800)" }}>
              <span className="text-xs font-bold" style={{ color: "white" }}>EB</span>
            </div>
            <span className="font-bold text-sm tracking-wide" style={{ color: "var(--text-primary)" }}>Éden Beauty</span>
          </div>

          <div className="mb-7">
            <h2 style={{ fontSize: "1.375rem" }}>Entrar na conta</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Acesse o painel do seu estabelecimento
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="input"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label" style={{ marginBottom: 0 }}>Senha</label>
                <a href="/recuperar-senha" className="text-xs" style={{ color: "var(--brand-500)" }}>
                  Esqueci a senha
                </a>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm" style={{ backgroundColor: "var(--danger-bg)", color: "var(--danger)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary w-full" style={{ padding: "0.625rem 1rem", marginTop: "0.5rem" }}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  Entrando...
                </span>
              ) : "Entrar"}
            </button>
          </form>

          <hr className="my-6 divider" />

          <p className="text-center text-sm" style={{ color: "var(--text-muted)" }}>
            É cliente do salão?{" "}
            <Link href="/cadastro" style={{ color: "var(--brand-600)", fontWeight: 500 }}>
              Crie sua conta aqui
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
