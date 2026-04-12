"use client";

import { useState } from "react";
import Link from "next/link";
import { resetPassword } from "@/app/login/actions";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) { setErro("Informe seu e-mail."); return; }
    setLoading(true);
    setErro("");

    const formData = new FormData(e.currentTarget);
    const result = await resetPassword(formData);

    if (result?.error) {
      setErro(result.error);
    } else {
      setEnviado(true);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "var(--bg)" }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--brand-800)" }}>
            <span className="text-xs font-bold text-white">EB</span>
          </div>
          <span className="font-bold text-sm tracking-wide" style={{ color: "var(--text-primary)" }}>Éden Beauty</span>
        </div>

        {enviado ? (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto" style={{ background: "#f0fdf4", border: "2px solid #bbf7d0" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div>
              <h2 style={{ fontSize: "1.25rem" }}>E-mail enviado!</h2>
              <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
                Enviamos um link de redefinição para <strong>{email}</strong>. Verifique sua caixa de entrada e spam.
              </p>
            </div>
            <Link href="/login" className="btn btn-primary w-full" style={{ padding: "0.625rem" }}>
              Voltar ao login
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-7">
              <h2 style={{ fontSize: "1.375rem" }}>Recuperar senha</h2>
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                Informe seu e-mail e enviaremos um link para redefinir a senha.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">E-mail</label>
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="input"
                  autoComplete="email"
                  required
                />
              </div>

              {erro && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm" style={{ backgroundColor: "var(--danger-bg)", color: "var(--danger)" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {erro}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn btn-primary w-full" style={{ padding: "0.625rem" }}>
                {loading ? "Enviando..." : "Enviar link de redefinição"}
              </button>
            </form>

            <p className="text-center text-sm mt-6" style={{ color: "var(--text-muted)" }}>
              Lembrou a senha?{" "}
              <Link href="/login" style={{ color: "var(--brand-600)", fontWeight: 500 }}>Entrar</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
