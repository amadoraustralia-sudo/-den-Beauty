"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { criarAgendamento } from "./actions";

const FORMAS_PAGAMENTO = [
  { value: "pix",      label: "Pix" },
  { value: "credito",  label: "Cartão de Crédito" },
  { value: "debito",   label: "Cartão de Débito" },
  { value: "dinheiro", label: "Dinheiro" },
];

const errStyle = { borderColor: "var(--danger)", boxShadow: "0 0 0 2px rgb(239 68 68 / 0.15)" };

interface Cliente { id: string; nome: string }
interface Servico { id: string; nome: string; preco: number; duracao_min: number }
interface Profissional { id: string; nome: string }
interface Slot { hora: string; profissional_id: string; profissional_nome: string; disponivel: boolean }

export default function NovoAgendamentoForm({
  clientes,
  servicos,
  profissionais,
  clienteInicial,
  hoje,
  salaoId,
}: {
  clientes: Cliente[];
  servicos: Servico[];
  profissionais: Profissional[];
  clienteInicial?: string;
  hoje: string;
  salaoId?: string | null;
}) {
  const router = useRouter();

  const [fields, setFields] = useState({
    cliente_id: clienteInicial ?? "",
    servico_id: "",
    profissional_id: "",
    data: hoje,
    hora: "",
    valor: "",
    status: "aguardando",
    forma_pagamento: "",
    observacoes: "",
  });
  const [erros, setErros] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [pending, setPending] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  function set(field: string, value: string) {
    setFields((f) => ({ ...f, [field]: value }));
    if (erros[field]) setErros((e) => { const n = { ...e }; delete n[field]; return n; });
  }

  function handleServicoChange(servicoId: string) {
    const svc = servicos.find((s) => s.id === servicoId);
    setFields((f) => ({
      ...f,
      servico_id: servicoId,
      hora: "",
      valor: !f.valor && svc ? String(svc.preco) : f.valor,
    }));
    if (erros.servico_id) setErros((e) => { const n = { ...e }; delete n.servico_id; return n; });
  }

  function handleDataChange(data: string) {
    setFields((f) => ({ ...f, data, hora: "" }));
    if (erros.data) setErros((e) => { const n = { ...e }; delete n.data; return n; });
  }

  function handleProfissionalChange(profissionalId: string) {
    setFields((f) => ({ ...f, profissional_id: profissionalId, hora: "" }));
  }

  function selecionarSlot(hora: string) {
    setFields((f) => ({ ...f, hora }));
    if (erros.hora) setErros((e) => { const n = { ...e }; delete n.hora; return n; });
  }

  useEffect(() => {
    if (!fields.servico_id || !fields.data || !salaoId) {
      setSlots([]);
      return;
    }
    let cancelled = false;
    setLoadingSlots(true);
    setSlots([]);
    const supabase = createClient();
    supabase.rpc("get_horarios_disponiveis", {
      p_data: fields.data,
      p_servico_id: fields.servico_id,
      p_profissional_id: fields.profissional_id || null,
      p_salao_id: salaoId,
    }).then(({ data }) => {
      if (!cancelled) {
        setSlots(data ?? []);
        setLoadingSlots(false);
      }
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields.servico_id, fields.data, fields.profissional_id, salaoId]);

  // Deduplicate by hora, keeping first available
  const slotsUnicos = Array.from(
    slots.reduce<Map<string, Slot>>((map, s) => {
      const key = s.hora.slice(0, 5);
      if (!map.has(key) || (!map.get(key)!.disponivel && s.disponivel)) map.set(key, s);
      return map;
    }, new Map()).values()
  );

  function validate() {
    const e: Record<string, string> = {};
    if (!fields.cliente_id)  e.cliente_id = "Selecione um cliente";
    if (!fields.servico_id)  e.servico_id = "Selecione um serviço";
    if (!fields.data)        e.data = "Campo obrigatório";
    if (!fields.hora)        e.hora = "Selecione um horário";
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
  const temChaves = !!(fields.servico_id && fields.data);

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
              value={fields.profissional_id} onChange={(e) => handleProfissionalChange(e.target.value)}
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
        <div className="space-y-4">
          <div>
            <label className="label">Data <span style={{ color: "var(--danger)" }}>*</span></label>
            <input
              name="data" type="date" className="input"
              value={fields.data} onChange={(e) => handleDataChange(e.target.value)}
              style={erros.data ? errStyle : {}}
            />
            {erros.data && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{erros.data}</p>}
          </div>

          <input type="hidden" name="hora" value={fields.hora} />

          <div>
            <label className="label" style={erros.hora ? { color: "var(--danger)" } : {}}>
              Horário <span style={{ color: "var(--danger)" }}>*</span>
              {fields.hora && (
                <span className="ml-2 font-semibold" style={{ color: "var(--brand-600)" }}>
                  {fields.hora}
                </span>
              )}
            </label>

            {!salaoId ? (
              <input
                type="time" className="input"
                value={fields.hora} onChange={(e) => selecionarSlot(e.target.value)}
                style={erros.hora ? errStyle : {}}
              />
            ) : !temChaves ? (
              <p className="text-sm py-1" style={{ color: "var(--text-muted)" }}>
                Selecione um serviço e uma data para ver os horários.
              </p>
            ) : loadingSlots ? (
              <div className="flex items-center gap-2 py-2" style={{ color: "var(--text-muted)" }}>
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                <span className="text-sm">Carregando horários...</span>
              </div>
            ) : slotsUnicos.length === 0 ? (
              <p className="text-sm py-1" style={{ color: "var(--text-muted)" }}>
                Sem horários disponíveis nesta data.
              </p>
            ) : (
              <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(68px, 1fr))" }}>
                {slotsUnicos.map((s) => {
                  const hora = s.hora.slice(0, 5);
                  const selecionado = fields.hora === hora;
                  return (
                    <button
                      key={hora}
                      type="button"
                      disabled={!s.disponivel}
                      onClick={() => selecionarSlot(hora)}
                      style={{
                        padding: "0.5rem 0.25rem",
                        borderRadius: "0.5rem",
                        fontSize: "0.8125rem",
                        fontWeight: 500,
                        border: selecionado ? "2px solid var(--brand-600)" : "1px solid var(--border)",
                        background: selecionado ? "var(--brand-600)" : s.disponivel ? "white" : "transparent",
                        color: selecionado ? "white" : s.disponivel ? "var(--text-primary)" : "var(--text-muted)",
                        cursor: s.disponivel ? "pointer" : "not-allowed",
                        opacity: s.disponivel ? 1 : 0.4,
                        transition: "all 0.15s",
                      }}
                    >
                      {hora}
                    </button>
                  );
                })}
              </div>
            )}

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
              {FORMAS_PAGAMENTO.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
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

      <div>
        <label className="label">Observações</label>
        <textarea
          name="observacoes" rows={3} placeholder="Preferências do cliente, alergias, observações..." className="input"
          style={{ resize: "vertical" }}
          value={fields.observacoes} onChange={(e) => set("observacoes", e.target.value)}
        />
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
