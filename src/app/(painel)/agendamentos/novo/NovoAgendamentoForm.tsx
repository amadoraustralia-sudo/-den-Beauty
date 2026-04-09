"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { criarAgendamento } from "./actions";

const FORMAS_PAGAMENTO = ["Pix", "Cartão de Crédito", "Cartão de Débito", "Dinheiro", "Outro"];

const errStyle = { borderColor: "var(--danger)", boxShadow: "0 0 0 2px rgb(239 68 68 / 0.15)" };

interface Cliente { id: string; nome: string }
interface Servico { id: string; nome: string; preco: number; duracao_min: number }
interface Profissional { id: string; nome: string }

export default function NovoAgendamentoForm({
  clientes,
  servicos,
  profissionais,
  clienteInicial,
  hoje,
}: {
  clientes: Cliente[];
  servicos: Servico[];
  profissionais: Profissional[];
  clienteInicial?: string;
  hoje: string;
}) {
  const router = useRouter();

  const [fields, setFields] = useState({
    cliente_id: clienteInicial ?? "",
    servico_id: "",
    profissional_id: "",
    data: hoje,
    hora: "09:00",
    valor: "",
    status: "aguardando",
    forma_pagamento: "",
  });
  const [erros, setErros] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [pending, setPending] = useState(false);

  function set(field: string, value: string) {
    setFields((f) => ({ ...f, [field]: value }));
    if (erros[field]) setErros((e) => { const n = { ...e }; delete n[field]; return n; });
  }

  // Preenche valor automaticamente ao selecionar serviço
  function handleServicoChange(servicoId: string) {
    set("servico_id", servicoId);
    const svc = servicos.find((s) => s.id === servicoId);
    if (svc && !fields.valor) {
      setFields((f) => ({ ...f, servico_id: servicoId, valor: String(svc.preco) }));
    }
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!fields.cliente_id)  e.cliente_id = "Selecione um cliente";
    if (!fields.servico_id)  e.servico_id = "Selecione um serviço";
    if (!fields.data)        e.data = "Campo obrigatório";
    if (!fields.hora)        e.hora = "Campo obrigatório";
    if (fields.status === "concluido" && !fields.forma_pagamento)
      e.forma_pagamento = "Obrigatório ao concluir";
    setErros(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (!validate()) return;
    setPending(true);
    setServerError("");

    const fd = new FormData(ev.currentTarget);
    const result = await criarAgendamento(fd);
    if (result?.error) {
      const msg = result.error.startsWith("db:") ? result.error.slice(3) : "Erro ao salvar. Tente novamente.";
      setServerError(msg);
      setPending(false);
    }
  }

  const concluido = fields.status === "concluido";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {serverError && (
        <div className="mb-4 rounded-xl p-3.5" style={{ background: "#fff5f5", border: "1px solid #fecaca" }}>
          <p className="text-sm" style={{ color: "#b91c1c" }}>{serverError}</p>
        </div>
      )}

      <div>
        <h4 className="mb-3" style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Cliente e serviço
        </h4>
        <div className="space-y-4">
          <div>
            <label className="label">Cliente <span style={{ color: "var(--danger)" }}>*</span></label>
            <select
              name="cliente_id" className="input select"
              value={fields.cliente_id} onChange={(e) => set("cliente_id", e.target.value)}
              style={erros.cliente_id ? errStyle : {}}
            >
              <option value="">Selecione o cliente...</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
            {erros.cliente_id && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{erros.cliente_id}</p>}
            {clientes.length === 0 && (
              <p className="text-xs mt-1.5"><a href="/clientes/novo" style={{ color: "var(--brand-600)" }}>Cadastre um cliente primeiro.</a></p>
            )}
          </div>
          <div>
            <label className="label">Serviço <span style={{ color: "var(--danger)" }}>*</span></label>
            <select
              name="servico_id" className="input select"
              value={fields.servico_id} onChange={(e) => handleServicoChange(e.target.value)}
              style={erros.servico_id ? errStyle : {}}
            >
              <option value="">Selecione o serviço...</option>
              {servicos.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome} — {s.duracao_min}min · R$ {Number(s.preco).toFixed(2).replace(".", ",")}
                </option>
              ))}
            </select>
            {erros.servico_id && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{erros.servico_id}</p>}
          </div>
          <div>
            <label className="label">Profissional</label>
            <select
              name="profissional_id" className="input select"
              value={fields.profissional_id} onChange={(e) => set("profissional_id", e.target.value)}
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
          Data e horário
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Data <span style={{ color: "var(--danger)" }}>*</span></label>
            <input
              name="data" type="date" className="input"
              value={fields.data} onChange={(e) => set("data", e.target.value)}
              style={erros.data ? errStyle : {}}
            />
            {erros.data && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{erros.data}</p>}
          </div>
          <div>
            <label className="label">Horário <span style={{ color: "var(--danger)" }}>*</span></label>
            <input
              name="hora" type="time" className="input"
              value={fields.hora} onChange={(e) => set("hora", e.target.value)}
              style={erros.hora ? errStyle : {}}
            />
            {erros.hora && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{erros.hora}</p>}
          </div>
        </div>
      </div>

      <hr className="divider" />

      <div>
        <h4 className="mb-3" style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Pagamento e status
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Valor cobrado (R$)</label>
            <input
              name="valor" type="number" min="0" step="0.01" placeholder="Preço do serviço" className="input"
              value={fields.valor} onChange={(e) => set("valor", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Status</label>
            <select
              name="status" className="input select"
              value={fields.status} onChange={(e) => set("status", e.target.value)}
            >
              <option value="aguardando">Aguardando</option>
              <option value="confirmado">Confirmado</option>
              <option value="concluido">Concluído</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="label">
              Forma de pagamento
              {concluido && <span style={{ color: "var(--danger)" }}> *</span>}
            </label>
            <select
              name="forma_pagamento" className="input select"
              value={fields.forma_pagamento} onChange={(e) => set("forma_pagamento", e.target.value)}
              style={erros.forma_pagamento ? errStyle : {}}
            >
              <option value="">Não informado</option>
              {FORMAS_PAGAMENTO.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
            {erros.forma_pagamento && (
              <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{erros.forma_pagamento}</p>
            )}
            {concluido && !erros.forma_pagamento && (
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                Obrigatório para agendamentos concluídos
              </p>
            )}
          </div>
        </div>
      </div>

      <hr className="divider" />

      <div className="flex gap-3 justify-end">
        <button type="button" onClick={() => router.push("/agendamentos")} className="btn btn-secondary">Cancelar</button>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Salvando..." : "Salvar agendamento"}
        </button>
      </div>
    </form>
  );
}
