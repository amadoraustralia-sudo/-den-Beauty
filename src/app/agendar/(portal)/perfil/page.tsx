"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

export default function PerfilPortalPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [clienteId, setClienteId] = useState<string | null>(null);

  const [fields, setFields] = useState({
    nome: "",
    telefone: "",
    data_nascimento: "",
    alergias: "",
    preferencias: "",
  });

  function set(field: string, value: string) {
    setFields((f) => ({ ...f, [field]: value }));
    setSaved(false);
  }

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserEmail(user.email ?? "");

      // busca cliente por auth_user_id ou email
      let cliente = null;
      const { data: c1 } = await supabase.from("clientes").select("*").eq("auth_user_id", user.id).single();
      if (c1) { cliente = c1; }
      else if (user.email) {
        const { data: c2 } = await supabase.from("clientes").select("*").eq("email", user.email).single();
        cliente = c2;
      }

      if (cliente) {
        setClienteId(cliente.id);
        setFields({
          nome:             cliente.nome ?? "",
          telefone:         cliente.telefone ?? "",
          data_nascimento:  cliente.data_nascimento ?? "",
          alergias:         cliente.alergias ?? "",
          preferencias:     cliente.preferencias ?? "",
        });
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clienteId) return;
    setSaving(true);
    setError("");

    const supabase = createClient();
    const { error: err } = await supabase.from("clientes").update({
      nome:            fields.nome.trim(),
      telefone:        fields.telefone.trim() || null,
      data_nascimento: fields.data_nascimento || null,
      alergias:        fields.alergias.trim() || null,
      preferencias:    fields.preferencias.trim() || null,
    }).eq("id", clienteId);

    if (err) {
      setError("Erro ao salvar. Tente novamente.");
    } else {
      setSaved(true);
    }
    setSaving(false);
  }

  const errStyle = { borderColor: "var(--danger)", boxShadow: "0 0 0 2px rgb(239 68 68 / 0.15)" };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--brand-600)" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold"
          style={{ background: "var(--brand-100)", color: "var(--brand-700)" }}
        >
          {fields.nome ? getInitials(fields.nome) : "?"}
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Meu perfil</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{userEmail}</p>
        </div>
      </div>

      {/* Toast salvo */}
      {saved && (
        <div className="mb-6 rounded-xl p-4 flex items-center gap-3" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          <p className="text-sm font-medium" style={{ color: "#15803d" }}>Perfil atualizado com sucesso!</p>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-xl p-4 flex items-center gap-3" style={{ background: "var(--danger-bg)", border: "1px solid #fecaca" }}>
          <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Dados pessoais */}
        <div className="rounded-xl p-5 space-y-4" style={{ background: "white", border: "1px solid var(--border)" }}>
          <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Dados pessoais
          </h2>

          <div>
            <label className="label">Nome completo <span style={{ color: "var(--danger)" }}>*</span></label>
            <input
              value={fields.nome} onChange={(e) => set("nome", e.target.value)}
              placeholder="Seu nome" className="input" required
            />
          </div>

          <div>
            <label className="label">E-mail</label>
            <input
              value={userEmail} disabled readOnly className="input"
              style={{ opacity: 0.6, cursor: "not-allowed" }}
            />
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>O e-mail não pode ser alterado aqui.</p>
          </div>

          <div>
            <label className="label">WhatsApp</label>
            <input
              type="tel" value={fields.telefone} onChange={(e) => set("telefone", e.target.value)}
              placeholder="(11) 99999-9999" className="input"
            />
          </div>

          <div>
            <label className="label">Data de nascimento</label>
            <input
              type="date" value={fields.data_nascimento} onChange={(e) => set("data_nascimento", e.target.value)}
              className="input"
            />
          </div>
        </div>

        {/* Preferências */}
        <div className="rounded-xl p-5 space-y-4" style={{ background: "white", border: "1px solid var(--border)" }}>
          <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Preferências e observações
          </h2>

          <div>
            <label className="label flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
              Alergias / Contraindicações
            </label>
            <textarea
              rows={3} value={fields.alergias} onChange={(e) => set("alergias", e.target.value)}
              placeholder="Ex: alergia a amônia, sensibilidade na couro cabeludo..."
              className="input" style={{ resize: "vertical" }}
            />
          </div>

          <div>
            <label className="label">Preferências</label>
            <textarea
              rows={3} value={fields.preferencias} onChange={(e) => set("preferencias", e.target.value)}
              placeholder="Ex: prefiro máquina 2 nas laterais, gosto de franja mais longa..."
              className="input" style={{ resize: "vertical" }}
            />
          </div>
        </div>

        {/* Segurança */}
        <div className="rounded-xl p-5" style={{ background: "white", border: "1px solid var(--border)" }}>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)" }}>
            Segurança
          </h2>
          <Link
            href="/agendar/perfil/senha"
            className="flex items-center justify-between"
            style={{ color: "var(--text-primary)", textDecoration: "none" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--bg)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <span className="text-sm font-medium">Alterar senha</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </Link>
        </div>

        <button
          type="submit" disabled={saving}
          className="btn btn-primary w-full"
          style={{ padding: "0.875rem", backgroundColor: "var(--brand-800)", borderColor: "var(--brand-800)" }}
        >
          {saving ? "Salvando..." : "Salvar alterações"}
        </button>
      </form>
    </div>
  );
}
