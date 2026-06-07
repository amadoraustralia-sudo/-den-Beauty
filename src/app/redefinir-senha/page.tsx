"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [pronto, setPronto] = useState(false);
  const [sessaoValida, setSessaoValida] = useState(false);

  useEffect(() => {
    // Supabase injeta a sessão via hash na URL automaticamente
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setSessaoValida(true);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (senha.length < 12) { setErro("A senha deve ter no mínimo 12 caracteres."); return; }
    if (senha !== confirma) { setErro("As senhas não coincidem."); return; }

    setLoading(true);
    setErro("");

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: senha });

    if (error) {
      setErro("Não foi possível redefinir a senha. O link pode ter expirado.");
    } else {
      setPronto(true);
      setTimeout(() => router.push("/login"), 2500);
    }
    setLoading(false);
  }

  if (!sessaoValida) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "var(--bg)" }}>
        <div className="text-center max-w-sm space-y-4">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Link inválido ou expirado.</p>
          <Link href="/recuperar-senha" className="btn btn-primary">Solicitar novo link</Link>
        </div>
      </div>
    );
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

        {pronto ? (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto" style={{ background: "#f0fdf4", border: "2px solid #bbf7d0" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2 style={{ fontSize: "1.25rem" }}>Senha redefinida!</h2>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Redirecionando para o login...</p>
          </div>
        ) : (
          <>
            <div className="mb-7">
              <h2 style={{ fontSize: "1.375rem" }}>Nova senha</h2>
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>Escolha uma senha segura com pelo menos 12 caracteres.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Nova senha</label>
                <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Mínimo 12 caracteres" className="input" required />
              </div>
              <div>
                <label className="label">Confirmar nova senha</label>
                <input type="password" value={confirma} onChange={(e) => setConfirma(e.target.value)} placeholder="Repita a senha" className="input" required />
              </div>

              {erro && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm" style={{ backgroundColor: "var(--danger-bg)", color: "var(--danger)" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {erro}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn btn-primary w-full" style={{ padding: "0.625rem" }}>
                {loading ? "Salvando..." : "Definir nova senha"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
