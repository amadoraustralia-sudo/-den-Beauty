"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { criarCliente } from "./actions";

interface Profissional { id: string; nome: string }

const errStyle = { borderColor: "var(--danger)", boxShadow: "0 0 0 2px rgb(239 68 68 / 0.15)" };

export default function NovoClienteForm({ profissionais }: { profissionais: Profissional[] }) {
  const router = useRouter();

  const [fields, setFields] = useState({
    nome: "", telefone: "", email: "", data_nascimento: "",
    alergias: "", preferencias: "", profissional_preferido_id: "",
  });
  const [erros, setErros] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [pending, setPending] = useState(false);

  function set(field: string, value: string) {
    setFields((f) => ({ ...f, [field]: value }));
    if (erros[field]) setErros((e) => { const n = { ...e }; delete n[field]; return n; });
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!fields.nome.trim()) e.nome = "Campo obrigatório";
    setErros(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (!validate()) return;
    setPending(true);
    setServerError("");

    const fd = new FormData(ev.currentTarget);
    const result = await criarCliente(fd);
    if (result?.error) {
      setServerError(result.error);
      setPending(false);
    }
    // on success the server action redirects — control never reaches here
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {serverError && (
        <div className="mb-4 rounded-xl p-3.5" style={{ background: "#fff5f5", border: "1px solid #fecaca" }}>
          <p className="text-sm" style={{ color: "#b91c1c" }}>{serverError}</p>
        </div>
      )}

      <div>
        <h4 className="mb-3" style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Dados básicos
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label">Nome completo <span style={{ color: "var(--danger)" }}>*</span></label>
            <input
              name="nome" placeholder="Ex: Ana Lima" className="input"
              value={fields.nome} onChange={(e) => set("nome", e.target.value)}
              style={erros.nome ? errStyle : {}}
            />
            {erros.nome && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{erros.nome}</p>}
          </div>
          <div>
            <label className="label">WhatsApp</label>
            <input
              name="telefone" placeholder="(11) 99999-9999" className="input"
              value={fields.telefone} onChange={(e) => set("telefone", e.target.value)}
            />
          </div>
          <div>
            <label className="label">E-mail</label>
            <input
              name="email" type="email" placeholder="cliente@email.com" className="input"
              value={fields.email} onChange={(e) => set("email", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Data de nascimento</label>
            <input
              name="data_nascimento" type="date" className="input"
              value={fields.data_nascimento} onChange={(e) => set("data_nascimento", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Profissional preferido</label>
            <select
              name="profissional_preferido_id" className="input select"
              value={fields.profissional_preferido_id} onChange={(e) => set("profissional_preferido_id", e.target.value)}
            >
              <option value="">Sem preferência</option>
              {profissionais.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>
        </div>
      </div>

      <hr className="divider" />

      <div>
        <h4 className="mb-3" style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Observações e preferências
        </h4>
        <div className="space-y-4">
          <div>
            <label className="label">
              <span className="flex items-center gap-1.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                Alergias / Contraindicações
              </span>
            </label>
            <textarea
              name="alergias" rows={2} placeholder="Ex: alergia a amônia..." className="input"
              style={{ resize: "vertical" }}
              value={fields.alergias} onChange={(e) => set("alergias", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Preferências</label>
            <textarea
              name="preferencias" rows={2} placeholder="Ex: máquina 2 nas laterais..." className="input"
              style={{ resize: "vertical" }}
              value={fields.preferencias} onChange={(e) => set("preferencias", e.target.value)}
            />
          </div>
        </div>
      </div>

      <hr className="divider" />

      <div className="flex gap-3 justify-end">
        <button type="button" onClick={() => router.push("/clientes")} className="btn btn-secondary">Cancelar</button>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Salvando..." : "Salvar cliente"}
        </button>
      </div>
    </form>
  );
}
