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
  successRedirect?: string;
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

export default function BookingFlow({ servicos, profissionais, clienteId, clienteNome, isLogado, successRedirect }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("servico");
  const [servico, setServico] = useState<Servico | null>(null);
  const [profissional, setProfissional] = useState<Profissional | null>(null);
  const [qualquerProf, setQualquerProf] = useState(false);
  const [data, setData] = useState("");
  const [slot, setSlot] = useState<Slot | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState("");

  // Categorias dos serviços
  const categorias = [...new Set(servicos.map((s) => s.categoria))];

  // Datas disponíveis (próximos 30 dias, exceto domingo)
  const hoje = new Date();
  const datas: string[] = [];
  for (let i = 1; i <= 30; i++) {
    const d = new Date(hoje); d.setDate(hoje.getDate() + i);
    if (d.getDay() !== 0) { // sem domingo
      datas.push(d.toISOString().split("T")[0]);
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
    });
    setSlots(resultado?.filter((s: Slot) => s.disponivel) ?? []);
    setLoadingSlots(false);
  }

  async function confirmar() {
    if (!slot || !servico) return;
    setErro("");

    if (!isLogado) {
      router.push(`/login?redirect=/agendar`);
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
        valor: servico.preco,
        status: "aguardando",
        origem: "portal_cliente",
      });

      if (error) {
        setErro("Erro ao criar agendamento. Tente novamente.");
        return;
      }

      setStep("sucesso");
    });
  }

  // Progresso
  const stepIdx = STEPS.indexOf(step);

  if (step === "sucesso") {
    return (
      <div className="card p-8 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "var(--brand-100)" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--brand-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <h2 className="mb-2">Agendamento solicitado!</h2>
        <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
          <strong style={{ color: "var(--text-primary)" }}>{servico?.nome}</strong> com <strong style={{ color: "var(--text-primary)" }}>{slot?.profissional_nome}</strong>
        </p>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          {new Date(data + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })} às {slot?.hora.slice(0, 5)}
        </p>
        <p className="text-xs mb-6 px-4 py-3 rounded-lg" style={{ background: "var(--warning-bg)", color: "var(--warning)" }}>
          Aguardando confirmação do salão. Você receberá uma notificação em breve.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => { setStep("servico"); setServico(null); setProfissional(null); setData(""); setSlot(null); }}
            className="btn btn-secondary"
          >
            Novo agendamento
          </button>
          <a href={successRedirect ?? "/minha-conta"} className="btn btn-primary">
            {successRedirect ? "Ver agendamentos" : "Minha conta"}
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
              ✂️ {servico.nome} · {formatPreco(servico.preco)}
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
          {categorias.map((cat) => (
            <div key={cat}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2 px-1" style={{ color: "var(--text-muted)" }}>{cat}</p>
              <div className="card overflow-hidden">
                {servicos.filter((s) => s.categoria === cat).map((s, i, arr) => (
                  <button
                    key={s.id}
                    onClick={() => { setServico(s); setStep("profissional"); }}
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
          <p className="text-sm font-medium mb-4" style={{ color: "var(--text-secondary)" }}>
            Horários disponíveis em {new Date(data + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
          </p>

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
              {/* Agrupa por profissional se for qualquer um */}
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

            {[
              { label: "Serviço", value: servico.nome },
              { label: "Duração", value: formatDuracao(servico.duracao_min) },
              { label: "Valor", value: formatPreco(servico.preco) },
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
              <strong>Faça login</strong> ou <a href="/cadastro" style={{ color: "var(--info)", fontWeight: 600 }}>crie uma conta</a> para confirmar o agendamento. É rápido e gratuito.
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
