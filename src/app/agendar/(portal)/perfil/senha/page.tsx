"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function AlterarSenhaPage() {
  const router = useRouter();
  const [fields, setFields] = useState({ nova: "", confirma: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(field: string, value: string) {
    setFields((f) => ({ ...f, [field]: value }));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (fields.nova.length < 8) { setError("A senha deve ter no mínimo 8 caracteres."); return; }
    if (fields.nova !== fields.confirma) { setError("As senhas não coincidem."); return; }

    setSaving(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password: fields.nova });

    if (err) {
      setError("Erro ao alterar senha. Tente novamente.");
      setSaving(false);
    } else {
      router.push("/agendar/perfil?toast=senha");
    }
  }

  return (
    <div className="p-4 lg:p-8 max-w-md mx-auto">
      <Link href="/agendar/perfil" className="flex items-center gap-1.5 text-sm mb-6" style={{ color: "var(--text-muted)" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        Voltar ao perfil
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Alterar senha</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Crie uma nova senha para sua conta.</p>
      </div>

      <div className="rounded-xl p-5" style={{ background: "white", border: "1px solid var(--border)" }}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nova senha <span style={{ color: "var(--danger)" }}>*</span></label>
            <input
              type="password" value={fields.nova} onChange={(e) => set("nova", e.target.value)}
              placeholder="Mínimo 8 caracteres" className="input" required
            />
          </div>
          <div>
            <label className="label">Confirmar nova senha <span style={{ color: "var(--danger)" }}>*</span></label>
            <input
              type="password" value={fields.confirma} onChange={(e) => set("confirma", e.target.value)}
              placeholder="Repita a senha" className="input" required
            />
          </div>

          {error && (
            <div className="px-3 py-2.5 rounded-lg text-sm" style={{ background: "var(--danger-bg)", color: "var(--danger)" }}>
              {error}
            </div>
          )}

          <button
            type="submit" disabled={saving}
            className="btn btn-primary w-full"
            style={{ padding: "0.75rem", backgroundColor: "var(--brand-800)", borderColor: "var(--brand-800)" }}
          >
            {saving ? "Salvando..." : "Alterar senha"}
          </button>
        </form>
      </div>
    </div>
  );
}
