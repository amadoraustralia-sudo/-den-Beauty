"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Servico { id: string; nome: string; categoria: string; duracao_min: number; preco: number }
interface Profissional { id: string; nome: string; especialidades: string[] | null }
interface Slot { hora: string; profissional_id: string; profissional_nome: string; disponivel: boolean }

interface Props {
  servicos: Servico[];
  profissionais: Profissional[];
  clienteId: string | null;
  clienteNome: string | null;
  isLogado: boolean;
  salaoId?: string | null;
  diasFuncionamento?: string[] | null;
  successRedirect?: string;
  // M1: rotas do portal configuráveis (default = portal /agendar)
  loginHref?: string;
  cadastroHref?: string;
}

type Step = "servico" | "profissional" | "data" | "hora" | "confirmar" | "sucesso";

function formatPreco(v: number) {
  return `R$ ${Number(v).toFixed(2).replace(".", ",")}`;
}

function formatDuracao(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

const STEPS: Step[] = ["servico", "profissional", "data", "hora", "confirmar"];
const STEP_LABELS: Record<Step, string> = {
  servico: "Serviço", profissional: "Profissional", data: "Data",
  hora: "Horário", confirmar: "Confirmar", sucesso: "Confirmado",
};

const DAY_KEYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];

export default function BookingFlow({ servicos, profissionais, clienteId, clienteNome, isLogado, salaoId, diasFuncionamento, successRedirect, loginHref, cadastroHref }: Props) {
  const router = useRouter();
  // M1: defaults apontam para o portal /agendar/*
  const LOGIN_HREF = loginHref ?? "/agendar/login";
  const CADASTRO_HREF = cadastroHref ?? "/agendar/cadastro";
  const SUCCESS_HREF = successRedirect ?? "/agendar/meus-agendamentos";
  const [step, setStep] = useState<Step>("servico");
  const [servico, setServico] = useState<Servico | null>(null);
  const [servicosAdicionais, setServicosAdicionais] = useState<Servico[]>([]);
  const [profissional, setProfissional] = useState<Profissional | null>(null);
  const [qualquerProf, setQualquerProf] = useState(false);
  const [data, setData] = useState("");
  const [slot, setSlot] = useState<Slot | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState("");

  const duracaoTotal = (servico?.duracao_min ?? 0) + servicosAdicionais.reduce((acc, s) => acc + s.duracao_min, 0);
  const precoTotal = (servico?.preco ?? 0) + servicosAdicionais.reduce((acc, s) => acc + s.preco, 0);

  // Serviços disponíveis para adicionar
  const servicosDisponiveis = servicos.filter(
    (s) => s.id !== servico?.id && !servicosAdicionais.find((a) => a.id === s.id)
  );

  // Categorias dos serviços
  const categorias = [...new Set(servicos.map((s) => s.categoria))];

  function toLocalDateStr(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  const hoje = new Date();
  const diasAtivos = diasFuncionamento ?? ["seg", "ter", "qua", "qui", "sex", "sab"];
  const datas: string[] = [];
  for (let i = 0; i <= 29; i++) {
    const d = new Date(hoje); d.setDate(hoje.getDate() + i);
    if (diasAtivos.includes(DAY_KEYS[d.getDay()])) {
      datas.push(toLocalDateStr(d));
    }
  }

  async function carregarSlots(dataStr: string) {
    if (!servico) return;
    setLoadingSlots(true);
    setSlots([]);
    const supabase = createClient();
    const { data: resultado } = await supabase.rpc("get_horarios_disponiveis", {
      p_data: dataStr,
      p_servico_id: servico.id,
      p_profissional_id: (!qualquerProf && profissional) ? profissional.id : null,
      p_salao_id: salaoId ?? null,
      p_duracao_total: duracaoTotal > 0 ? duracaoTotal : null,
    });
    setSlots(resultado?.filter((s: Slot) => s.disponivel) ?? []);
    setLoadingSlots(false);
  }

  function selecionarServicoPrincipal(s: Servico) {
    setServico(s);
    setServicosAdicionais([]);
    setSlot(null);
    setSlots([]);
  }

  function adicionarServicoAdicional(servicoId: string) {
    if (!servicoId) return;
    const svc = servicos.find((s) => s.id === servicoId);
    if (!svc) return;
    setServicosAdicionais((prev) => [...prev, svc]);
    setSlot(null);
    setSlots([]);
  }

  function removerServicoAdicional(idx: number) {
    setServicosAdicionais((prev) => prev.filter((_, i) => i !== idx));
    setSlot(null);
    setSlots([]);
  }

  async function confirmar() {
    if (!slot || !servico) return;
    setErro("");

    if (!isLogado) {
      router.push(LOGIN_HREF); // M1: era "/login"
      return;
    }

    if (!clienteId) {
      setErro("Seu cadastro de cliente não foi encontrado. Entre em contato com o salão.");
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.from("agendamentos").insert({
        cliente_id: clienteId,
        servico_id: servico.id,
        profissional_id: slot.profissional_id,
        data,
        hora: slot.hora,
        valor: precoTotal,
        status: "aguardando",
        origem: "portal_cliente",
        salao_id: salaoId ?? null,
        servicos_adicionais: servicosAdicionais.map((s) => ({ id: s.id, nome: s.nome, preco: s.preco, duracao_min: s.duracao_min })),
      });

      if (error) {
        setErro("Erro ao criar agendamento. Tente novamente.");
        return;
      }

      setStep("sucesso");
    });
  }

  const stepIdx = STEPS.indexOf(step);

  if (step === "sucesso") {
    const nomesServicos = [servico?.nome, ...servicosAdicionais.map((s) => s.nome)].filter(Boolean).join(" + ");
    return (
      <div className="card p-8 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "var(--brand-100)" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--brand-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <h2 className="mb-2">Agendamento solicitado!</h2>
        <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
          <strong style={{ color: "var(--text-primary)" }}>{nomesServicos}</strong> com <strong style={{ color: "var(--text-primary)" }}>{slot?.profissional_nome}</strong>
        </p>
        <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
          {new Date(data + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })} às {slot?.hora.slice(0, 5)}
        </p>
        <p className="text-sm mb-6 font-semibold" style={{ color: "var(--brand-700)" }}>{formatPreco(precoTotal)}</p>
        <p className="text-xs mb-6 px-4 py-3 rounded-lg" style={{ background: "var(--warning-bg)", color: "var(--warning)" }}>
          Aguardando confirmação do salão. Você receberá uma notificação em breve.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => { setStep("servico"); setServico(null); setServicosAdicionais([]); setProfissional(null); setData(""); setSlot(null); }}
            className="btn btn-secondary"
          >
            Novo agendamento
          </button>
          {/* M1: default era "/minha-conta" */}
          <a href={SUCCESS_HREF} className="btn btn-primary">
            Ver agendamentos
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progresso */}
      <div className="card p-4">
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => {
            const done = i < stepIdx;
            const active = i === stepIdx;
            return (
              <div key={s} className="flex items-center gap-1 flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors"
                    style={{
                      background: done ? "var(--brand-500)" : active ? "var(--brand-800)" : "var(--bg-subtle)",
                      color: done || active ? "white" : "var(--text-muted)",
                    }}
                  >
                    {done ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    ) : i + 1}
                  </div>
                  <span
                    className="text-xs font-medium hidden sm:block"
                    style={{ color: active ? "var(--text-primary)" : done ? "var(--text-secondary)" : "var(--text-disabled)" }}
                  >
                    {STEP_LABELS[s]}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-px mx-1" style={{ background: done ? "var(--brand-200)" : "var(--border)" }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Resumo do selecionado */}
      {(servico || data || slot) && step !== "servico" && (
        <div className="flex flex-wrap gap-2">
          {servico && (
            <button onClick={() => setStep("servico")} className="badge badge-green" style={{ cursor: "pointer", padding: "0.35rem 0.65rem" }}>
              ✂️ {servico.nome}{servicosAdicionais.length > 0 ? ` +${servicosAdicionais.length}` : ""} · {formatPreco(precoTotal)}
            </button>
          )}
          {(profissional || qualquerProf) && step !== "profissional" && (
            <button onClick={() => setStep("profissional")} className="badge badge-blue" style={{ cursor: "pointer", padding: "0.35rem 0.65rem" }}>
              👤 {qualquerProf ? "Qualquer profissional" : profissional?.nome}
            </button>
          )}
          {data && step !== "data" && (
            <button onClick={() => { setStep("data"); setSlot(null); }} className="badge badge-gray" style={{ cursor: "pointer", padding: "0.35rem 0.65rem" }}>
              📅 {new Date(data + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
            </button>
          )}
          {slot && step === "confirmar" && (
            <button onClick={() => setStep("hora")} className="badge badge-gray" style={{ cursor: "pointer", padding: "0.35rem 0.65rem" }}>
              🕐 {slot.hora.slice(0, 5)}
            </button>
          )}
        </div>
      )}

      {/* STEP: Serviço */}
      {step === "servico" && (
        <div className="space-y-4">
          {/* Serviços selecionados */}
          {servico && (
            <div className="card p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Serviços selecionados</p>

              {/* Principal */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{servico.nome}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{formatDuracao(servico.duracao_min)} · {formatPreco(servico.preco)}</p>
                </div>
                <button
                  onClick={() => { setServico(null); setServicosAdicionais([]); }}
                  className="text-xs px-2 py-1 rounded"
                  style={{ background: "var(--bg-subtle)", color: "var(--text-muted)", border: "none", cursor: "pointer" }}
                >
                  Trocar
                </button>
              </div>

              {/* Adicionais */}
              {servicosAdicionais.map((s, i) => (
                <div key={s.id} className="flex items-center justify-between pl-3" style={{ borderLeft: "2px solid var(--brand-200)" }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{s.nome}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{formatDuracao(s.duracao_min)} · {formatPreco(s.preco)}</p>
                  </div>
                  <button
                    onClick={() => removerServicoAdicional(i)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1.1rem", lineHeight: 1 }}
                  >
                    ×
                  </button>
                </div>
              ))}

              {/* Total */}
              {servicosAdicionais.length > 0 && (
                <div className="pt-2 flex justify-between" style={{ borderTop: "1px solid var(--border)" }}>
                  <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Total</span>
                  <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{formatDuracao(duracaoTotal)} · {formatPreco(precoTotal)}</span>
                </div>
              )}

              {/* Adicionar mais */}
              {servicosDisponiveis.length > 0 && (
                <select
                  className="input select w-full"
                  style={{ fontSize: "0.8125rem" }}
                  value=""
                  onChange={(e) => adicionarServicoAdicional(e.target.value)}
                >
                  <option value="">+ Adicionar outro serviço</option>
                  {servicosDisponiveis.map((s) => (
                    <option key={s.id} value={s.id}>{s.nome} — {formatDuracao(s.duracao_min)} · {formatPreco(s.preco)}</option>
                  ))}
                </select>
              )}

              <button
                onClick={() => setStep("profissional")}
                className="btn btn-primary w-full"
              >
                Continuar
              </button>
            </div>
          )}

          {/* Lista de serviços para escolher */}
          {!servico && categorias.length === 0 && (
            <div className="card p-8 text-center">
              <div className="text-3xl mb-3">🔍</div>
              <p className="font-medium mb-1" style={{ color: "var(--text-primary)" }}>Nenhum serviço disponível</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Não conseguimos carregar os serviços do salão. Entre em contato para agendar.
              </p>
            </div>
          )}
          {!servico && categorias.map((cat) => (
            <div key={cat}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2 px-1" style={{ color: "var(--text-muted)" }}>{cat}</p>
              <div className="card overflow-hidden">
                {servicos.filter((s) => s.categoria === cat).map((s, i, arr) => (
                  <button
                    key={s.id}
                    onClick={() => selecionarServicoPrincipal(s)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:bg-[var(--bg-subtle)]"
                    style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}
                  >
                    <div>
                      <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>{s.nome}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{formatDuracao(s.duracao_min)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-sm" style={{ color: "var(--brand-600)" }}>{formatPreco(s.preco)}</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* STEP: Profissional */}
      {step === "profissional" && (
        <div className="card overflow-hidden">
          <button
            onClick={() => { setQualquerProf(true); setProfissional(null); setStep("data"); }}
            className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[var(--bg-subtle)]"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--bg-subtle)", border: "1px dashed var(--border-strong)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v2m0 16v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M2 12h2m16 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>Sem preferência</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Escolha o horário disponível com qualquer profissional</p>
            </div>
            <svg className="ml-auto" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>

          {profissionais.map((p, i) => (
            <button
              key={p.id}
              onClick={() => { setProfissional(p); setQualquerProf(false); setStep("data"); }}
              className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[var(--bg-subtle)]"
              style={{ borderBottom: i < profissionais.length - 1 ? "1px solid var(--border)" : "none" }}
            >
              <div className="avatar avatar-md avatar-green flex-shrink-0">{getInitials(p.nome)}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>{p.nome}</p>
                {p.especialidades && p.especialidades.length > 0 && (
                  <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {p.especialidades.slice(0, 3).join(" · ")}
                  </p>
                )}
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          ))}
        </div>
      )}

      {/* STEP: Data */}
      {step === "data" && (
        <div className="card p-5">
          <p className="text-sm font-medium mb-4" style={{ color: "var(--text-secondary)" }}>Escolha uma data</p>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
            {datas.map((d) => {
              const dt = new Date(d + "T12:00:00");
              const isSelected = d === data;
              return (
                <button
                  key={d}
                  onClick={() => { setData(d); carregarSlots(d); setStep("hora"); }}
                  className="flex flex-col items-center py-3 px-1 rounded-xl transition-colors"
                  style={{
                    border: `1px solid ${isSelected ? "var(--brand-400)" : "var(--border)"}`,
                    background: isSelected ? "var(--brand-800)" : "var(--surface)",
                  }}
                >
                  <span className="text-xs" style={{ color: isSelected ? "rgb(255 255 255 / 0.6)" : "var(--text-muted)", textTransform: "uppercase" }}>
                    {dt.toLocaleDateString("pt-BR", { weekday: "short" })}
                  </span>
                  <span className="text-base font-bold mt-0.5" style={{ color: isSelected ? "white" : "var(--text-primary)" }}>
                    {dt.getDate()}
                  </span>
                  <span className="text-xs" style={{ color: isSelected ? "rgb(255 255 255 / 0.6)" : "var(--text-muted)" }}>
                    {dt.toLocaleDateString("pt-BR", { month: "short" })}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP: Horário */}
      {step === "hora" && (
        <div className="card p-5">
          <p className="text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
            Horários disponíveis em {new Date(data + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          {duracaoTotal > 0 && (
            <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
              Duração total: <strong>{formatDuracao(duracaoTotal)}</strong>
            </p>
          )}

          {loadingSlots ? (
            <div className="flex items-center justify-center py-8 gap-2" style={{ color: "var(--text-muted)" }}>
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              Buscando horários...
            </div>
          ) : slots.length === 0 ? (
            <div className="empty-state" style={{ padding: "2rem" }}>
              <div className="empty-state-icon">😔</div>
              <p className="empty-state-title">Nenhum horário disponível</p>
              <p className="empty-state-desc">Tente outra data ou profissional.</p>
              <button onClick={() => setStep("data")} className="btn btn-secondary" style={{ marginTop: "1rem", fontSize: "0.8125rem" }}>
                Escolher outra data
              </button>
            </div>
          ) : (
            <>
              {qualquerProf ? (
                [...new Set(slots.map((s) => s.profissional_nome))].map((nome) => (
                  <div key={nome} className="mb-4">
                    <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-muted)" }}>{nome}</p>
                    <div className="flex flex-wrap gap-2">
                      {slots.filter((s) => s.profissional_nome === nome).map((s) => (
                        <button
                          key={`${s.profissional_id}-${s.hora}`}
                          onClick={() => { setSlot(s); setStep("confirmar"); }}
                          className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
                          style={{ border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)" }}
                        >
                          {s.hora.slice(0, 5)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-wrap gap-2">
                  {slots.map((s) => (
                    <button
                      key={`${s.profissional_id}-${s.hora}`}
                      onClick={() => { setSlot(s); setStep("confirmar"); }}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      style={{ border: "1px solid var(--brand-200)", background: "var(--brand-50)", color: "var(--brand-700)" }}
                    >
                      {s.hora.slice(0, 5)}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* STEP: Confirmar */}
      {step === "confirmar" && servico && slot && (
        <div className="space-y-4">
          <div className="card p-5 space-y-4">
            <h3>Resumo do agendamento</h3>

            {/* Serviços */}
            <div className="flex items-start justify-between gap-4">
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                {servicosAdicionais.length > 0 ? "Serviços" : "Serviço"}
              </span>
              <div className="text-right">
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{servico.nome}</p>
                {servicosAdicionais.map((s) => (
                  <p key={s.id} className="text-sm" style={{ color: "var(--text-secondary)" }}>+ {s.nome}</p>
                ))}
              </div>
            </div>

            {[
              { label: "Duração total", value: formatDuracao(duracaoTotal) },
              { label: "Valor total", value: formatPreco(precoTotal) },
              { label: "Profissional", value: slot.profissional_nome },
              {
                label: "Data e hora",
                value: `${new Date(data + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })} às ${slot.hora.slice(0, 5)}`,
              },
            ].map((item) => (
              <div key={item.label} className="flex items-start justify-between gap-4">
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>{item.label}</span>
                <span className="text-sm font-medium text-right" style={{ color: "var(--text-primary)" }}>{item.value}</span>
              </div>
            ))}
          </div>

          {!isLogado && (
            <div className="px-4 py-3 rounded-xl text-sm" style={{ background: "var(--info-bg)", border: "1px solid #BFDBFE", color: "var(--info)" }}>
              <strong>Faça login</strong> ou <a href={CADASTRO_HREF} style={{ color: "var(--info)", fontWeight: 600 }}>crie uma conta</a> para confirmar o agendamento. É rápido e gratuito.
            </div>
          )}

          {erro && (
            <div className="px-4 py-3 rounded-xl text-sm" style={{ background: "var(--danger-bg)", color: "var(--danger)" }}>
              {erro}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep("hora")} className="btn btn-secondary flex-1">
              Voltar
            </button>
            <button
              onClick={confirmar}
              disabled={isPending}
              className="btn btn-primary flex-1"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  Confirmando...
                </span>
              ) : isLogado ? "Confirmar agendamento" : "Entrar para confirmar"}
            </button>
          </div>
        </div>
      )}

      {/* Voltar (steps intermediários) */}
      {(step === "profissional" || step === "data") && (
        <button
          onClick={() => {
            if (step === "profissional") setStep("servico");
            if (step === "data") setStep("profissional");
          }}
          className="btn btn-ghost"
          style={{ fontSize: "0.8125rem" }}
        >
          ← Voltar
        </button>
      )}
    </div>
  );
}
