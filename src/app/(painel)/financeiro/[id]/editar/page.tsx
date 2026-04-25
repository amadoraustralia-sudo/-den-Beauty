"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { atualizarTransacao } from "./actions";

const CATEGORIAS = ["Serviço", "Produto", "Gorjeta", "Aluguel", "Produto / Insumo", "Salário", "Equipamento", "Marketing", "Utilidades", "Outros"];
const errStyle = { borderColor: "var(--danger)", boxShadow: "0 0 0 2px rgb(239 68 68 / 0.15)" };

export default function EditarTransacaoPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const errosParam = searchParams.get("erros")?.split(",") ?? [];

  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [serverError, setServerError] = useState(searchParams.get("erro") === "db" ? "Erro ao salvar. Tente novamente." : "");
  const [fields, setFields] = useState({
    tipo: "entrada", descricao: "", valor: "", data: "", categoria: "",
  });

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from("transacoes").select("*").eq("id", id).single();
      if (data) {
        setFields({
          tipo: data.tipo ?? "entrada",
          descricao: data.descricao ?? "",
          valor: data.valor != null ? String(data.valor) : "",
          data: data.data ?? "",
          categoria: data.categoria ?? "",
        });
      }
      setLoading(false);
    }
    load();
  }, [id]);

  function set(field: string, value: string) {
    setFields((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setPending(true);
    setServerError("");
    const fd = new FormData(ev.currentTarget);
    fd.set("id", id);
    await atualizarTransacao(fd);
    setPending(false);
  }

  if (loading) return (
    <div className="p-8 flex items-center justify-center">
      <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--brand-600)" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
    </div>
  );

  return (
    <div className="p-6 max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <button type="button" onClick={() => router.push("/financeiro")} className="btn btn-secondary" style={{ padding: "0.375rem 0.625rem" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div>
          <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Editar lançamento</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Altere os dados da transação</p>
        </div>
      </div>

      {serverError && (
        <div className="mb-4 rounded-xl p-3.5" style={{ background: "#fff5f5", border: "1px solid #fecaca" }}>
          <p className="text-sm" style={{ color: "#b91c1c" }}>{serverError}</p>
        </div>
      )}

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <input type="hidden" name="id" value={id} />

          <div>
            <label className="label">Tipo *</label>
            <div className="grid grid-cols-2 gap-3 mt-1.5">
              {[
                { val: "entrada", label: "Entrada (receita)", color: "var(--success)" },
                { val: "saida",   label: "Saída (despesa)",   color: "var(--danger)"  },
              ].map((t) => (
                <label key={t.val} className="flex items-center gap-2 p-3 rounded-xl cursor-pointer" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
                  <input type="radio" name="tipo" value={t.val} checked={fields.tipo === t.val} onChange={() => set("tipo", t.val)} style={{ accentColor: t.color }} />
                  <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{t.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Descrição *</label>
            <input type="text" name="descricao" className="input" maxLength={120}
              value={fields.descricao} onChange={(e) => set("descricao", e.target.value)}
              style={errosParam.includes("descricao") ? errStyle : {}} />
            {errosParam.includes("descricao") && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>Campo obrigatório</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Valor (R$) *</label>
              <input type="number" name="valor" className="input" step="0.01" min="0.01"
                value={fields.valor} onChange={(e) => set("valor", e.target.value)}
                style={errosParam.includes("valor") ? errStyle : {}} />
              {errosParam.includes("valor") && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>Valor inválido</p>}
            </div>
            <div>
              <label className="label">Data *</label>
              <input type="date" name="data" className="input"
                value={fields.data} onChange={(e) => set("data", e.target.value)}
                style={errosParam.includes("data") ? errStyle : {}} />
            </div>
          </div>

          <div>
            <label className="label">Categoria</label>
            <select name="categoria" className="input" value={fields.categoria} onChange={(e) => set("categoria", e.target.value)}>
              <option value="">Sem categoria</option>
              {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => router.push("/financeiro")} className="btn flex-1 text-center">Cancelar</button>
            <button type="submit" className="btn btn-primary flex-1" disabled={pending}>
              {pending ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
