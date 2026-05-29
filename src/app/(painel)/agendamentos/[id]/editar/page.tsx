"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { atualizarAgendamento, deletarAgendamento } from "./actions";

interface Slot { hora: string; profissional_id: string; profissional_nome: string; disponivel: boolean }

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

function formatPreco(v: number) {
  return `R$ ${Number(v).toFixed(2).replace(".", ",")}`;
}

export default function EditarAgendamentoPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [serverError, setServerError] = useState("");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [salaoId, setSalaoId] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [servicosAdicionais, setServicosAdicionais] = useState<Servico[]>([]);
  const [fields, setFields] = useState({
    cliente_id: "", servico_id: "", profissional_id: "",
    data: "", hora: "", valor: "", status: "aguardando",
    forma_pagamento: "", observacoes: "",
  });
  const [erros, setErros] = useState<Record<string, string>>({});

  function set(field: string, value: string) {
    setFields((f) => ({ ...f, [field]: value }));
    if (erros[field]) setErros((e) => { const n = { ...e }; delete n[field]; return n; });
  }

  const servicoPrincipal = servicos.find((s) => s.id === fields.servico_id) ?? null;
  const duracaoTotal = (servicoPrincipal?.duracao_min ?? 0) + servicosAdicionais.reduce((acc, s) => acc + s.duracao_min, 0);

  const servicosDisponiveis = servicos.filter(
    (s) => s.id !== fields.servico_id && !servicosAdicionais.find((a) => a.id === s.id)
  );

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [{ data: ag }, { data: cls }, { data: svcs }, { data: profs }] = await Promise.all([
        supabase.from("agendamentos").select("*").eq("id", id).single(),
        supabase.from("clientes").select("id, nome").order("nome"),
        supabase.from("servicos").select("id, nome, preco, duracao_min").eq("ativo", true).order("nome"),
        supabase.from("profissionais").select("id, nome").eq("ativo", true).order("nome"),
      ]);
      if (ag) {
        setSalaoId(ag.salao_id ?? null);
        setFields({
          cliente_id: ag.cliente_id ?? "",
          servico_id: ag.servico_id ?? "",
          profissional_id: ag.profissional_id ?? "",
          data: ag.data ?? "",
          hora: ag.hora?.slice(0, 5) ?? "",
          valor: ag.valor != null ? String(ag.valor) : "",
          status: ag.status ?? "aguardando",
          forma_pagamento: ag.forma_pagamento ?? "",
          observacoes: ag.observacoes ?? "",
        });
        // Load servicos_adicionais — validate against the actual servicos list later
        if (Array.isArray(ag.servicos_adicionais)) {
          setServicosAdicionais(ag.servicos_adicionais as Servico[]);
        }
      }
      setClientes(cls ?? []);
      setServicos(svcs ?? []);
      setProfissionais(profs ?? []);
      setLoading(false);
    }
    load();
  }, [id]);

  useEffect(() => {
    if (!fields.servico_id || !fields.data || !salaoId) { setSlots([]); return; }
    let cancelled = false;
    setLoadingSlots(true);
    setSlots([]);
    const supabase = createClient();
    supabase.rpc("get_horarios_disponiveis", {
      p_data: fields.data,
      p_servico_id: fields.servico_id,
      p_profissional_id: fields.profissional_id || null,
      p_salao_id: salaoId,
      p_duracao_total: duracaoTotal > 0 ? duracaoTotal : null,
    }).then(({ data }) => {
      if (!cancelled) { setSlots(data ?? []); setLoadingSlots(false); }
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields.servico_id, fields.data, fields.profissional_id, salaoId, duracaoTotal]);

  const slotsUnicos = Array.from(
    slots.reduce<Map<string, Slot>>((map, s) => {
      const key = s.hora.slice(0, 5);
      if (!map.has(key) || (!map.get(key)!.disponivel && s.disponivel)) map.set(key, s);
      return map;
    }, new Map()).values()
  );

  const slotsComAtual = (() => {
    if (!fields.hora || !salaoId || loadingSlots) return slotsUnicos;
    const horaAtual = fields.hora.slice(0, 5);
    if (slotsUnicos.some((s) => s.hora.slice(0, 5) === horaAtual)) return slotsUnicos;
    return [
      { hora: horaAtual, profissional_id: fields.profissional_id || "", profissional_nome: "", disponivel: true },
      ...slotsUnicos,
    ];
  })();

  function handleServicoChange(servicoId: string) {
    const svc = servicos.find((s) => s.id === servicoId);
    setServicosAdicionais([]);
    setFields((f) => ({ ...f, servico_id: servicoId, hora: "", valor: !f.valor && svc ? String(svc.preco) : f.valor }));
    if (erros.servico_id) setErros((e) => { const n = { ...e }; delete n.servico_id; return n; });
  }

  function adicionarServico(servicoId: string) {
    if (!servicoId) return;
    const svc = servicos.find((s) => s.id === servicoId);
    if (!svc) return;
    setServicosAdicionais((prev) => [...prev, svc]);
    setFields((f) => ({ ...f, hora: "" }));
  }

  function removerServico(idx: number) {
    setServicosAdicionais((prev) => {
      const novo = prev.filter((_, i) => i !== idx);
      setFields((f) => ({ ...f, hora: "" }));
      return novo;
    });
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

  function validate() {
    const e: Record<string, string> = {};
    if (!fields.cliente_id) e.cliente_id = "Selecione um cliente";
    if (!fields.servico_id) e.servico_id = "Selecione um serviço";
    if (!fields.data)       e.data = "Campo obrigatório";
    if (!fields.hora)       e.hora = "Campo obrigatório";
    if (fields.status === "concluido" && !fields.forma_pagamento) e.forma_pagamento = "Obrigatório ao concluir";
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
    fd.set("servicos_adicionais", JSON.stringify(servicosAdicionais.map((s) => ({ id: s.id, nome: s.nome, preco: s.preco, duracao_min: s.duracao_min }))));
    const result = await atualizarAgendamento(fd);
    if (result?.error) { setServerError(result.error); setPending(false); }
  }

  async function handleDelete() {
    setDeleting(true);
    const result = await deletarAgendamento(id);
    if (result?.error) { setServerError(result.error); setDeleting(false); setConfirmDelete(false); }
  }

  if (loading) return (
    <div className="p-8 flex items-center justify-center">
      <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--brand-600)" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
    </div>
  );

  const concluido = fields.status === "concluido";

  return (
    <div className="p-6 max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <button type="button" onClick={() => router.push("/agendamentos")} className="btn btn-secondary" style={{ padding: "0.375rem 0.625rem" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div>
          <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Editar agendamento</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Altere os dados do agendamento</p>
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
            <h4 className="mb-3" style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Cliente e serviços</h4>
            <div className="space-y-4">
              <div>
                <label className="label">Cliente <span style={{ color: "var(--danger)" }}>*</span></label>
                <select name="cliente_id" className="input select" value={fields.cliente_id} onChange={(e) => set("cliente_id", e.target.value)} style={erros.cliente_id ? errStyle : {}}>
                  <option value="">Selecione o cliente...</option>
                  {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
                {erros.cliente_id && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{erros.cliente_id}</p>}
              </div>
              <div>
                <label className="label">Serviço principal <span style={{ color: "var(--danger)" }}>*</span></label>
                <select name="servico_id" className="input select" value={fields.servico_id} onChange={(e) => handleServicoChange(e.target.value)} style={erros.servico_id ? errStyle : {}}>
                  <option value="">Selecione o serviço...</option>
                  {servicos.map((s) => <option key={s.id} value={s.id}>{s.nome} — {s.duracao_min}min · {formatPreco(s.preco)}</option>)}
                </select>
                {erros.servico_id && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{erros.servico_id}</p>}
              </div>

              {/* Serviços adicionais */}
              {fields.servico_id && (
                <div>
                  {servicosAdicionais.length > 0 && (
                    <div className="mb-2 space-y-1.5">
                      {servicosAdicionais.map((s, i) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between px-3 py-2 rounded-lg text-sm"
                          style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}
                        >
                          <span style={{ color: "var(--text-primary)" }}>
                            {s.nome} <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>— {s.duracao_min}min · {formatPreco(s.preco)}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => removerServico(i)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1rem", padding: "0 2px", lineHeight: 1 }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        Total: <strong style={{ color: "var(--text-primary)" }}>{duracaoTotal}min</strong>
                      </p>
                    </div>
                  )}
                  {servicosDisponiveis.length > 0 && (
                    <select
                      className="input select"
                      value=""
                      onChange={(e) => adicionarServico(e.target.value)}
                    >
                      <option value="">+ Adicionar serviço</option>
                      {servicosDisponiveis.map((s) => (
                        <option key={s.id} value={s.id}>{s.nome} — {s.duracao_min}min · {formatPreco(s.preco)}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div>
                <label className="label">Profissional</label>
                <select name="profissional_id" className="input select" value={fields.profissional_id} onChange={(e) => handleProfissionalChange(e.target.value)}>
                  <option value="">Sem preferência</option>
                  {profissionais.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>
            </div>
          </div>

          <hr className="divider" />

          <div>
            <h4 className="mb-3" style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Data e horário</h4>
            <div className="space-y-4">
              <div>
                <label className="label">Data <span style={{ color: "var(--danger)" }}>*</span></label>
                <input type="date" name="data" className="input" value={fields.data} onChange={(e) => handleDataChange(e.target.value)} style={erros.data ? errStyle : {}} />
                {erros.data && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{erros.data}</p>}
              </div>
              <input type="hidden" name="hora" value={fields.hora} />
              <div>
                <label className="label" style={erros.hora ? { color: "var(--danger)" } : {}}>
                  Horário <span style={{ color: "var(--danger)" }}>*</span>
                  {fields.hora && <span className="ml-2 font-semibold" style={{ color: "var(--brand-600)" }}>{fields.hora}</span>}
                </label>
                {!salaoId ? (
                  <input type="time" className="input" value={fields.hora} onChange={(e) => selecionarSlot(e.target.value)} style={erros.hora ? errStyle : {}} />
                ) : !fields.servico_id || !fields.data ? (
                  <p className="text-sm py-1" style={{ color: "var(--text-muted)" }}>Selecione um serviço e uma data para ver os horários.</p>
                ) : loadingSlots ? (
                  <div className="flex items-center gap-2 py-2" style={{ color: "var(--text-muted)" }}>
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    <span className="text-sm">Carregando horários...</span>
                  </div>
                ) : slotsComAtual.length === 0 ? (
                  <p className="text-sm py-1" style={{ color: "var(--text-muted)" }}>Sem horários disponíveis nesta data.</p>
                ) : (
                  <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(68px, 1fr))" }}>
                    {slotsComAtual.map((s) => {
                      const hora = s.hora.slice(0, 5);
                      const selecionado = fields.hora === hora;
                      return (
                        <button key={hora} type="button" disabled={!s.disponivel} onClick={() => selecionarSlot(hora)} style={{
                          padding: "0.5rem 0.25rem", borderRadius: "0.5rem", fontSize: "0.8125rem", fontWeight: 500,
                          border: selecionado ? "2px solid var(--brand-600)" : "1px solid var(--border)",
                          background: selecionado ? "var(--brand-600)" : s.disponivel ? "white" : "transparent",
                          color: selecionado ? "white" : s.disponivel ? "var(--text-primary)" : "var(--text-muted)",
                          cursor: s.disponivel ? "pointer" : "not-allowed", opacity: s.disponivel ? 1 : 0.4, transition: "all 0.15s",
                        }}>
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
            <h4 className="mb-3" style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Pagamento e status</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Valor cobrado (R$)</label>
                <input type="number" name="valor" min="0" step="0.01" className="input" value={fields.valor} onChange={(e) => set("valor", e.target.value)} />
              </div>
              <div>
                <label className="label">Status</label>
                <select name="status" className="input select" value={fields.status} onChange={(e) => set("status", e.target.value)}>
                  <option value="aguardando">Aguardando</option>
                  <option value="confirmado">Confirmado</option>
                  <option value="concluido">Concluído</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="label">
                  Forma de pagamento{concluido && <span style={{ color: "var(--danger)" }}> *</span>}
                </label>
                <select name="forma_pagamento" className="input select" value={fields.forma_pagamento} onChange={(e) => set("forma_pagamento", e.target.value)} style={erros.forma_pagamento ? errStyle : {}}>
                  <option value="">Não informado</option>
                  {FORMAS_PAGAMENTO.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
                {erros.forma_pagamento && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{erros.forma_pagamento}</p>}
              </div>
            </div>
          </div>

          <hr className="divider" />

          <div>
            <label className="label">Observações</label>
            <textarea name="observacoes" rows={3} className="input" style={{ resize: "vertical" }} value={fields.observacoes} onChange={(e) => set("observacoes", e.target.value)} />
          </div>

          <hr className="divider" />

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => router.push("/agendamentos")} className="btn btn-secondary">Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? "Salvando..." : "Salvar alterações"}</button>
          </div>
        </form>
      </div>

      <div className="mt-4 card p-4" style={{ borderColor: "#fecaca" }}>
        {!confirmDelete ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Excluir agendamento</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Esta ação não pode ser desfeita.</p>
            </div>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="btn"
              style={{ background: "#fff5f5", color: "#b91c1c", border: "1px solid #fecaca", fontSize: "0.8125rem" }}
            >
              Excluir
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm" style={{ color: "#b91c1c" }}>Confirmar exclusão?</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setConfirmDelete(false)} className="btn btn-secondary" style={{ fontSize: "0.8125rem" }}>Não</button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="btn"
                style={{ background: "#b91c1c", color: "white", border: "none", fontSize: "0.8125rem" }}
              >
                {deleting ? "Excluindo..." : "Sim, excluir"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
