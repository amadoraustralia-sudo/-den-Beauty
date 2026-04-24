"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import FormCard from "@/components/FormCard";
import { atualizarCliente } from "./actions";
import { createClient } from "@/lib/supabase/client";

const errStyle = { borderColor: "var(--danger)", boxShadow: "0 0 0 2px rgb(239 68 68 / 0.15)" };

export default function EditarClientePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [profissionais, setProfissionais] = useState<{ id: string; nome: string }[]>([]);
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

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [{ data: cliente }, { data: profs }] = await Promise.all([
        supabase.from("clientes").select("*").eq("id", id).single(),
        supabase.from("profissionais").select("id, nome").eq("ativo", true).order("nome"),
      ]);
      if (cliente) {
        setFields({
          nome: cliente.nome ?? "",
          telefone: cliente.telefone ?? "",
          email: cliente.email ?? "",
          data_nascimento: cliente.data_nascimento ?? "",
          alergias: cliente.alergias ?? "",
          preferencias: cliente.preferencias ?? "",
          profissional_preferido_id: cliente.profissional_preferido_id ?? "",
        });
      }
      setProfissionais(profs ?? []);
      setLoading(false);
    }
    load();
  }, [id]);

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
    fd.set("id", id);
    const result = await atualizarCliente(fd);
    if (result?.error) { setServerError(result.error); setPending(false); }
  }

  if (loading) return (
    <div className="p-8 flex items-center justify-center">
      <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--brand-600)" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
    </div>
  );

  return (
    <FormCard title="Editar cliente" subtitle="Atualize os dados do cliente" backHref={`/clientes/${id}`}>
      {serverError && (
        <div className="mb-4 rounded-xl p-3.5" style={{ background: "#fff5f5", border: "1px solid #fecaca" }}>
          <p className="text-sm" style={{ color: "#b91c1c" }}>{serverError}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-5">
        <input type="hidden" name="id" value={id} />
        <div>
          <h4 className="mb-3" style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Dados básicos</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Nome completo <span style={{ color: "var(--danger)" }}>*</span></label>
              <input name="nome" className="input" value={fields.nome} onChange={(e) => set("nome", e.target.value)} style={erros.nome ? errStyle : {}} />
              {erros.nome && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{erros.nome}</p>}
            </div>
            <div>
              <label className="label">WhatsApp</label>
              <input name="telefone" placeholder="(11) 99999-9999" className="input" value={fields.telefone} onChange={(e) => set("telefone", e.target.value)} />
            </div>
            <div>
              <label className="label">E-mail</label>
              <input name="email" type="email" className="input" value={fields.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div>
              <label className="label">Data de nascimento</label>
              <input name="data_nascimento" type="date" className="input" value={fields.data_nascimento} onChange={(e) => set("data_nascimento", e.target.value)} />
            </div>
            <div>
              <label className="label">Profissional preferido</label>
              <select name="profissional_preferido_id" className="input select" value={fields.profissional_preferido_id} onChange={(e) => set("profissional_preferido_id", e.target.value)}>
                <option value="">Sem preferência</option>
                {profissionais.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
          </div>
        </div>
        <hr className="divider" />
        <div>
          <h4 className="mb-3" style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Observações</h4>
          <div className="space-y-4">
            <div>
              <label className="label">Alergias / Contraindicações</label>
              <textarea name="alergias" rows={2} className="input" style={{ resize: "vertical" }} value={fields.alergias} onChange={(e) => set("alergias", e.target.value)} />
            </div>
            <div>
              <label className="label">Preferências</label>
              <textarea name="preferencias" rows={2} className="input" style={{ resize: "vertical" }} value={fields.preferencias} onChange={(e) => set("preferencias", e.target.value)} />
            </div>
          </div>
        </div>
        <hr className="divider" />
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => router.push(`/clientes/${id}`)} className="btn btn-secondary">Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? "Salvando..." : "Salvar alterações"}</button>
        </div>
      </form>
    </FormCard>
  );
}
