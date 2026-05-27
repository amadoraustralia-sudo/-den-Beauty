"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function CadastroPortalPage() {
  const router = useRouter();
  const [form, setForm] = useState({ nome: "", email: "", telefone: "", password: "", confirm: "" });
  const [aceite, setAceite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [erros, setErros] = useState<Record<string, string>>({});

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    if (erros[field]) setErros((e) => { const n = { ...e }; delete n[field]; return n; });
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.nome.trim())         e.nome = "Obrigatório";
    if (!form.email.trim())        e.email = "Obrigatório";
    if (!form.telefone.trim())     e.telefone = "Obrigatório";
    if (!form.password) e.password = "Obrigatório";
    if (form.password !== form.confirm) e.confirm = "Senhas não coincidem";
    if (!aceite)                   e.aceite = "Aceite os termos para continuar";
    setErros(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError("");

    const supabase = createClient();

    // 1. Criar conta no Supabase Auth
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { nome: form.nome, telefone: form.telefone },
      },
    });

    if (signUpError || !authData.user) {
      setError(
        signUpError?.message === "User already registered"
          ? "Este e-mail já está cadastrado. Faça login."
          : "Erro ao criar conta. Tente novamente."
      );
      setLoading(false);
      return;
    }

    // 2. Criar/vincular registro na tabela clientes via função SECURITY DEFINER
    // (garante salao_id correto e funciona mesmo sem sessão ativa)
    await supabase.rpc("register_portal_client", {
      p_nome: form.nome.trim(),
      p_email: form.email.trim(),
      p_telefone: form.telefone.trim(),
    });

    router.push("/agendar/inicio?toast=bemvindo");
    router.refresh();
  }

  const errStyle = { borderColor: "var(--danger)", boxShadow: "0 0 0 2px rgb(239 68 68 / 0.15)" };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "#F5F0E8" }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <Link href="/agendar" className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--brand-800)" }}>
            <span className="text-sm font-bold text-white">EB</span>
          </div>
          <span className="font-bold tracking-wide" style={{ color: "var(--brand-800)", fontSize: "1rem" }}>Éden Beauty</span>
        </Link>

        <div className="rounded-2xl p-6 shadow-sm" style={{ background: "white", border: "1px solid var(--border)" }}>
          <div className="mb-6">
            <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)" }}>Criar conta</h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>É grátis e leva menos de 1 minuto</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="label">Nome completo <span style={{ color: "var(--danger)" }}>*</span></label>
              <input
                value={form.nome} onChange={(e) => set("nome", e.target.value)}
                placeholder="Ana Lima" className="input"
                style={erros.nome ? errStyle : {}}
              />
              {erros.nome && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{erros.nome}</p>}
            </div>

            <div>
              <label className="label">E-mail <span style={{ color: "var(--danger)" }}>*</span></label>
              <input
                type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                placeholder="seu@email.com" className="input"
                style={erros.email ? errStyle : {}}
              />
              {erros.email && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{erros.email}</p>}
            </div>

            <div>
              <label className="label">WhatsApp <span style={{ color: "var(--danger)" }}>*</span></label>
              <input
                type="tel" value={form.telefone} onChange={(e) => set("telefone", e.target.value)}
                placeholder="(11) 99999-9999" className="input"
                style={erros.telefone ? errStyle : {}}
              />
              {erros.telefone && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{erros.telefone}</p>}
            </div>

            <div>
              <label className="label">Senha <span style={{ color: "var(--danger)" }}>*</span></label>
              <input
                type="password" value={form.password} onChange={(e) => set("password", e.target.value)}
                placeholder="Crie uma senha" className="input"
                style={erros.password ? errStyle : {}}
              />
              {erros.password && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{erros.password}</p>}
            </div>

            <div>
              <label className="label">Confirmar senha <span style={{ color: "var(--danger)" }}>*</span></label>
              <input
                type="password" value={form.confirm} onChange={(e) => set("confirm", e.target.value)}
                placeholder="Repita a senha" className="input"
                style={erros.confirm ? errStyle : {}}
              />
              {erros.confirm && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{erros.confirm}</p>}
            </div>

            {/* Termos */}
            <label className="flex items-start gap-2.5 cursor-pointer pt-1">
              <input
                type="checkbox" checked={aceite} onChange={(e) => setAceite(e.target.checked)}
                className="mt-0.5 flex-shrink-0"
                style={{ accentColor: "var(--brand-600)", width: 15, height: 15 }}
              />
              <span className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Concordo com os{" "}
                <Link href="/termos" target="_blank" style={{ color: "var(--brand-600)" }}>Termos de Uso</Link>
                {" "}e{" "}
                <Link href="/privacidade" target="_blank" style={{ color: "var(--brand-600)" }}>Política de Privacidade</Link>
              </span>
            </label>
            {erros.aceite && <p className="text-xs" style={{ color: "var(--danger)" }}>{erros.aceite}</p>}

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm" style={{ background: "var(--danger-bg)", color: "var(--danger)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="btn btn-primary w-full"
              style={{ padding: "0.75rem", backgroundColor: "var(--brand-800)", borderColor: "var(--brand-800)", marginTop: "0.5rem" }}
            >
              {loading ? "Criando conta..." : "Criar conta grátis"}
            </button>
          </form>

          <div className="mt-5 pt-5 text-center" style={{ borderTop: "1px solid var(--border)" }}>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Já tem conta?{" "}
              <Link href="/agendar/login" style={{ color: "var(--brand-600)", fontWeight: 600 }}>Entrar</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
