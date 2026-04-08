"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function CadastroPage() {
  const router = useRouter();
  const [form, setForm] = useState({ nome: "", email: "", telefone: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [aceite, setAceite] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    if (form.password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (!aceite) {
      setError("Você precisa aceitar os termos para continuar.");
      return;
    }

    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { nome: form.nome, telefone: form.telefone, role: "cliente" },
      },
    });

    if (error) {
      setError(error.message === "User already registered"
        ? "Este e-mail já está cadastrado."
        : "Erro ao criar conta. Tente novamente.");
      setLoading(false);
      return;
    }

    router.push("/cadastro/confirmacao");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "var(--bg)" }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--brand-800)" }}>
            <span className="text-xs font-bold" style={{ color: "white" }}>EB</span>
          </div>
          <span className="font-bold text-sm tracking-wide" style={{ color: "var(--text-primary)" }}>Éden Beauty</span>
        </div>

        <div className="mb-7">
          <h2 style={{ fontSize: "1.375rem" }}>Criar conta</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Agende serviços e acompanhe seu histórico
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="label">Nome completo <span style={{ color: "var(--danger)" }}>*</span></label>
            <input name="nome" required value={form.nome} onChange={handleChange} placeholder="Ana Lima" className="input" />
          </div>

          <div>
            <label className="label">E-mail <span style={{ color: "var(--danger)" }}>*</span></label>
            <input name="email" type="email" required value={form.email} onChange={handleChange} placeholder="seu@email.com" className="input" />
          </div>

          <div>
            <label className="label">WhatsApp</label>
            <input name="telefone" value={form.telefone} onChange={handleChange} placeholder="(11) 99999-9999" className="input" />
          </div>

          <div>
            <label className="label">Senha <span style={{ color: "var(--danger)" }}>*</span></label>
            <input name="password" type="password" required value={form.password} onChange={handleChange} placeholder="Mínimo 6 caracteres" className="input" />
          </div>

          <div>
            <label className="label">Confirmar senha <span style={{ color: "var(--danger)" }}>*</span></label>
            <input name="confirm" type="password" required value={form.confirm} onChange={handleChange} placeholder="Repita a senha" className="input" />
          </div>

          {/* LGPD */}
          <label className="flex items-start gap-2.5 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={aceite}
              onChange={(e) => setAceite(e.target.checked)}
              className="mt-0.5 flex-shrink-0"
              style={{ accentColor: "var(--brand-600)", width: 15, height: 15 }}
            />
            <span className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Concordo com os{" "}
              <a href="/termos" target="_blank" style={{ color: "var(--brand-600)" }}>Termos de Uso</a>
              {" "}e autorizo o uso dos meus dados conforme a{" "}
              <a href="/privacidade" target="_blank" style={{ color: "var(--brand-600)" }}>Política de Privacidade</a>
              {" "}(LGPD).
            </span>
          </label>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm" style={{ backgroundColor: "var(--danger-bg)", color: "var(--danger)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn btn-primary w-full" style={{ padding: "0.625rem 1rem" }}>
            {loading ? "Criando conta..." : "Criar conta"}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: "var(--text-muted)" }}>
          Já tem conta?{" "}
          <Link href="/login" style={{ color: "var(--brand-600)", fontWeight: 500 }}>
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
