"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import FormCard from "@/components/FormCard";
import { atualizarProfissional } from "./actions";
import { createClient } from "@/lib/supabase/client";

const especialidades = ["Corte", "Barba", "Coloração", "Escova", "Progressiva", "Hidratação", "Manicure", "Pedicure", "Design de sobrancelha", "Limpeza de pele", "Maquiagem"];
const errStyle = { borderColor: "var(--danger)", boxShadow: "0 0 0 2px rgb(239 68 68 / 0.15)" };

export default function EditarProfissionalPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState({ nome: "", cargo: "", email: "", telefone: "", percentual_comissao: "", periodo_fechamento: "mensal" });
  const [especialidadesSel, setEspecialidadesSel] = useState<string[]>([]);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [pending, setPending] = useState(false);

  function set(field: string, value: string) {
    setFields((f) => ({ ...f, [field]: value }));
    if (erros[field]) setErros((e) => { const n = { ...e }; delete n[field]; return n; });
  }

  function toggleEsp(esp: string) {
    setEspecialidadesSel((prev) => prev.includes(esp) ? prev.filter((e) => e !== esp) : [...prev, esp]);
  }

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from("profissionais").select("*").eq("id", id).single();
      if (data) {
        setFields({
          nome: data.nome ?? "",
          cargo: data.cargo ?? "",
          email: data.email ?? "",
          telefone: data.telefone ?? "",
          percentual_comissao: data.percentual_comissao != null ? String(data.percentual_comissao) : "",
          periodo_fechamento: data.periodo_fechamento ?? "mensal",
        });
        setEspecialidadesSel(data.especialidades ?? []);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  function validate() {
    const e: Record<string, string> = {};
    if (!fields.nome.trim()) e.nome = "Campo obrigatório";
    const c = fields.percentual_comissao !== "" ? Number(fields.percentual_comissao) : null;
    if (c !== null && (isNaN(c) || c < 0 || c > 100)) e.percentual_comissao = "Valor entre 0 e 100";
    setErros(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (!validate()) return;
    setPending(true);
    setServerError("");
    const fd = new FormData();
    fd.set("id", id);
    fd.set("nome", fields.nome);
    fd.set("cargo", fields.cargo);
    fd.set("email", fields.email);
    fd.set("telefone", fields.telefone);
    fd.set("percentual_comissao", fields.percentual_comissao);
    fd.set("periodo_fechamento", fields.periodo_fechamento);
    especialidadesSel.forEach((e) => fd.append("especialidades", e));
    const result = await atualizarProfissional(fd);
    if (result?.error) { setServerError(typeof result.error === "string" ? result.error : "Erro ao salvar."); setPending(false); }
  }

  if (loading) return (
    <div className="p-8 flex items-center justify-center">
      <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--brand-600)" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
    </div>
  );

  return (
    <FormCard title="Editar profissional" subtitle="Atualize os dados do profissional" backHref={`/profissionais/${id}`}>
      {serverError && (
        <div className="mb-4 rounded-xl p-3.5" style={{ background: "#fff5f5", border: "1px solid #fecaca" }}>
          <p className="text-sm" style={{ color: "#b91c1c" }}>{serverError}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <h4 className="mb-3" style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Dados pessoais</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Nome completo <span style={{ color: "var(--danger)" }}>*</span></label>
              <input name="nome" className="input" value={fields.nome} onChange={(e) => set("nome", e.target.value)} style={erros.nome ? errStyle : {}} />
              {erros.nome && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{erros.nome}</p>}
            </div>
            <div>
              <label className="label">Cargo / Função</label>
              <input name="cargo" placeholder="Ex: Designer de sobrancelhas" className="input" value={fields.cargo} onChange={(e) => set("cargo", e.target.value)} />
            </div>
            <div>
              <label className="label">E-mail</label>
              <input name="email" type="email" className="input" value={fields.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Telefone / WhatsApp</label>
              <input name="telefone" type="tel" placeholder="(11) 99999-9999" className="input" value={fields.telefone} onChange={(e) => set("telefone", e.target.value)} />
            </div>
          </div>
        </div>
        <hr className="divider" />
        <div>
          <h4 className="mb-3" style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Remuneração</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Comissão (%)</label>
              <input name="percentual_comissao" type="number" min="0" max="100" step="0.5" placeholder="—" className="input"
                value={fields.percentual_comissao} onChange={(e) => set("percentual_comissao", e.target.value)}
                style={erros.percentual_comissao ? errStyle : {}} />
              {erros.percentual_comissao && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{erros.percentual_comissao}</p>}
            </div>
            <div>
              <label className="label">Período de fechamento</label>
              <select name="periodo_fechamento" className="input select" value={fields.periodo_fechamento} onChange={(e) => set("periodo_fechamento", e.target.value)}>
                <option value="semanal">Semanal</option>
                <option value="quinzenal">Quinzenal</option>
                <option value="mensal">Mensal</option>
              </select>
            </div>
          </div>
        </div>
        <hr className="divider" />
        <div>
          <h4 className="mb-3" style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Especialidades</h4>
          <div className="flex flex-wrap gap-2">
            {especialidades.map((esp) => {
              const ativo = especialidadesSel.includes(esp);
              return (
                <button key={esp} type="button" onClick={() => toggleEsp(esp)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer text-sm transition-colors"
                  style={{ border: `1px solid ${ativo ? "var(--brand-600)" : "var(--border)"}`, background: ativo ? "var(--brand-50)" : "var(--surface)", color: ativo ? "var(--brand-700)" : "var(--text-secondary)", fontWeight: ativo ? 500 : 400 }}>
                  {ativo && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
                  {esp}
                </button>
              );
            })}
            {especialidadesSel.map((esp) => <input key={esp} type="hidden" name="especialidades" value={esp} />)}
          </div>
        </div>
        <hr className="divider" />
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => router.push(`/profissionais/${id}`)} className="btn btn-secondary">Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? "Salvando..." : "Salvar alterações"}</button>
        </div>
      </form>
    </FormCard>
  );
}
