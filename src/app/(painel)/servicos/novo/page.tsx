"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FormCard from "@/components/FormCard";
import { criarServico } from "./actions";

const categorias = ["Cabelo", "Barba", "Unhas", "Estética", "Sobrancelha", "Cílios", "Depilação", "Maquiagem", "Outro"];

const errStyle = { borderColor: "var(--danger)", boxShadow: "0 0 0 2px rgb(239 68 68 / 0.15)" };

export default function NovoServicoPage() {
  const router = useRouter();

  const [fields, setFields] = useState({
    nome: "", categoria: "", descricao: "", duracao_min: "", preco: "",
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
    if (!fields.nome.trim())                                          e.nome = "Campo obrigatório";
    if (!fields.categoria)                                            e.categoria = "Selecione uma categoria";
    if (!fields.duracao_min || Number(fields.duracao_min) < 1)       e.duracao_min = "Campo obrigatório";
    if (!fields.preco || isNaN(parseFloat(fields.preco.replace(",", ".")))) e.preco = "Campo obrigatório";
    setErros(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (!validate()) return;
    setPending(true);
    setServerError("");

    const fd = new FormData(ev.currentTarget);
    const result = await criarServico(fd);
    if (result?.error) {
      const msg = result.error.startsWith("db:") ? result.error.slice(3) : "Erro ao salvar. Tente novamente.";
      setServerError(msg);
      setPending(false);
    }
  }

  return (
    <FormCard title="Novo serviço" subtitle="Adicione um serviço ao catálogo" backHref="/servicos">
      {serverError && (
        <div className="mb-4 rounded-xl p-3.5" style={{ background: "#fff5f5", border: "1px solid #fecaca" }}>
          <p className="text-sm" style={{ color: "#b91c1c" }}>{serverError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <h4 className="mb-3" style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Informações do serviço
          </h4>
          <div className="space-y-4">
            <div>
              <label className="label">Nome do serviço <span style={{ color: "var(--danger)" }}>*</span></label>
              <input
                name="nome" placeholder="Ex: Corte + Escova" className="input"
                value={fields.nome} onChange={(e) => set("nome", e.target.value)}
                style={erros.nome ? errStyle : {}}
              />
              {erros.nome && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{erros.nome}</p>}
            </div>
            <div>
              <label className="label">Categoria <span style={{ color: "var(--danger)" }}>*</span></label>
              <select
                name="categoria" className="input select"
                value={fields.categoria} onChange={(e) => set("categoria", e.target.value)}
                style={erros.categoria ? errStyle : {}}
              >
                <option value="">Selecione...</option>
                {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {erros.categoria && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{erros.categoria}</p>}
            </div>
            <div>
              <label className="label">Descrição</label>
              <textarea
                name="descricao" rows={3} placeholder="Descreva os detalhes do serviço ao cliente..." className="input"
                style={{ resize: "vertical" }}
                value={fields.descricao} onChange={(e) => set("descricao", e.target.value)}
              />
            </div>
          </div>
        </div>

        <hr className="divider" />

        <div>
          <h4 className="mb-3" style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Tempo e preço
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Duração (minutos) <span style={{ color: "var(--danger)" }}>*</span></label>
              <input
                name="duracao_min" type="number" min="5" step="5" placeholder="60" className="input"
                value={fields.duracao_min} onChange={(e) => set("duracao_min", e.target.value)}
                style={erros.duracao_min ? errStyle : {}}
              />
              {erros.duracao_min && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{erros.duracao_min}</p>}
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Usado para bloquear a agenda</p>
            </div>
            <div>
              <label className="label">Preço (R$) <span style={{ color: "var(--danger)" }}>*</span></label>
              <input
                name="preco" type="number" min="0" step="0.01" placeholder="0,00" className="input"
                value={fields.preco} onChange={(e) => set("preco", e.target.value)}
                style={erros.preco ? errStyle : {}}
              />
              {erros.preco && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{erros.preco}</p>}
            </div>
          </div>
        </div>

        <hr className="divider" />

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => router.push("/servicos")} className="btn btn-secondary">Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? "Salvando..." : "Salvar serviço"}
          </button>
        </div>
      </form>
    </FormCard>
  );
}
