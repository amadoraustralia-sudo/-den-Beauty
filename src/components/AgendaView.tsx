"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { bloquearHorario, desbloquearHorario } from "@/app/(painel)/agenda/actions";

/* ── Types ────────────────────────────────────────────────────── */

interface ServicoAdicional { id: string; nome: string; preco: number; duracao_min: number }

interface Agendamento {
  id: string;
  hora: string;
  data: string;
  status: string;
  valor: number | null;
  clientes: { nome: string } | null;
  servicos: { nome: string; duracao_min: number } | null;
  profissionais: { nome: string } | null;
  profissional_id: string | null;
  servicos_adicionais?: ServicoAdicional[] | null;
}

interface Profissional { id: string; nome: string }

interface Bloqueio {
  id: string;
  profissional_id: string | null;
  data: string;
  hora_inicio: string;
  hora_fim: string;
  motivo: string | null;
}

interface HorarioDia { ativo: boolean; abre: string; fecha: string }

interface PopoverInfo {
  profId: string;
  profNome: string;
  data: string;
  hora: string;
  horaFim: string;
  estado: "disponivel" | "bloqueado";
  bloqueioId?: string;
  top: number;
  left: number;
}

interface Props {
  agendamentos: Agendamento[];
  profissionais: Profissional[];
  dataAtual: string;
  mondayStr: string;
  prevWeekDate: string;
  nextWeekDate: string;
  prevDayDate: string;
  nextDayDate: string;
  horariosSemana: Record<string, HorarioDia> | null;
  horarioAbertura: string | null;
  horarioFechamento: string | null;
  intervaloAgendamento: number;
  bloqueios: Bloqueio[];
}

/* ── Constants ────────────────────────────────────────────────── */

const statusColor: Record<string, { bg: string; text: string; border: string }> = {
  confirmado: { bg: "#E8F5E9", text: "#2E7D32", border: "#A7D7A9" },
  aguardando:  { bg: "#FEF3C7", text: "#B45309", border: "#FCD34D" },
  concluido:   { bg: "#DBEAFE", text: "#1E40AF", border: "#BFDBFE" },
  cancelado:   { bg: "#FEE2E2", text: "#B91C1C", border: "#FECACA" },
};

const DAY_KEYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
const DIAS_SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const WEEK_HOURS = Array.from({ length: 12 }, (_, i) => i + 8);

/* ── Helpers ──────────────────────────────────────────────────── */

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function addMinutes(hora: string, min: number): string {
  const total = timeToMinutes(hora) + min;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function dateOffset(base: string, days: number) {
  const d = new Date(base + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function getHorarioDia(
  dayKey: string,
  horariosSemana: Record<string, HorarioDia> | null,
  horarioAbertura: string | null,
  horarioFechamento: string | null
): HorarioDia {
  if (horariosSemana?.[dayKey]) return horariosSemana[dayKey];
  return {
    ativo: true,
    abre: horarioAbertura?.slice(0, 5) ?? "09:00",
    fecha: horarioFechamento?.slice(0, 5) ?? "19:00",
  };
}

function generateSlots(abre: string, fecha: string, intervalo: number): string[] {
  const slots: string[] = [];
  const lim = timeToMinutes(fecha);
  let cur = timeToMinutes(abre);
  while (cur < lim) {
    slots.push(`${String(Math.floor(cur / 60)).padStart(2, "0")}:${String(cur % 60).padStart(2, "0")}`);
    cur += intervalo;
  }
  return slots;
}

type SlotEstado =
  | { estado: "disponivel" }
  | { estado: "bloqueado"; bloqueioId: string }
  | { estado: "ocupado" };

function getSlotEstado(
  profId: string,
  data: string,
  hora: string,
  intervalo: number,
  agendamentos: Agendamento[],
  bloqueios: Bloqueio[]
): SlotEstado {
  const slotMin = timeToMinutes(hora);
  const slotFim = slotMin + intervalo;

  for (const b of bloqueios) {
    if (b.data !== data) continue;
    if (b.profissional_id !== null && b.profissional_id !== profId) continue;
    const bIni = timeToMinutes(b.hora_inicio.slice(0, 5));
    const bFim = timeToMinutes(b.hora_fim.slice(0, 5));
    if (slotMin < bFim && slotFim > bIni) return { estado: "bloqueado", bloqueioId: b.id };
  }

  for (const a of agendamentos) {
    if (a.data !== data || a.profissional_id !== profId || a.status === "cancelado") continue;
    const agMin = timeToMinutes((a.hora ?? "00:00").slice(0, 5));
    const agFim = agMin + (a.servicos?.duracao_min ?? intervalo);
    if (slotMin < agFim && slotFim > agMin) return { estado: "ocupado" };
  }

  return { estado: "disponivel" };
}

/* ── Component ────────────────────────────────────────────────── */

export default function AgendaView({
  agendamentos, profissionais, dataAtual, mondayStr,
  prevWeekDate, nextWeekDate,
  horariosSemana, horarioAbertura, horarioFechamento, intervaloAgendamento, bloqueios,
}: Props) {
  const router = useRouter();
  const [view, setView] = useState<"dia" | "semana">("dia");
  const [profFiltro, setProfFiltro] = useState<string>("todos");
  const [popover, setPopover] = useState<PopoverInfo | null>(null);
  const [actionPending, setActionPending] = useState(false);

  useEffect(() => {
    if (!popover) return;
    function close() { setPopover(null); }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [popover]);

  /* ── Day view setup ── */
  const dayKey = DAY_KEYS[new Date(dataAtual + "T12:00:00").getDay()];
  const horarioDia = getHorarioDia(dayKey, horariosSemana, horarioAbertura, horarioFechamento);
  const slotTimes = horarioDia.ativo ? generateSlots(horarioDia.abre, horarioDia.fecha, intervaloAgendamento) : [];
  const gridStartMin = horarioDia.ativo ? timeToMinutes(horarioDia.abre) : 8 * 60;
  const gridEndMin   = horarioDia.ativo ? timeToMinutes(horarioDia.fecha) : 20 * 60;
  const GRID_HEIGHT  = ((gridEndMin - gridStartMin) / 60) * 64;
  const slotHeight   = (intervaloAgendamento / 60) * 64;
  const gridHours    = Array.from(
    { length: Math.ceil((gridEndMin - gridStartMin) / 60) },
    (_, i) => Math.floor(gridStartMin / 60) + i
  );

  const agendamentosHoje = agendamentos.filter((a) => a.data === dataAtual);

  const byProf = profissionais
    .filter((p) => profFiltro === "todos" || p.id === profFiltro)
    .map((p) => ({
      ...p,
      items: agendamentosHoje.filter((a) => a.profissional_id === p.id),
    }));

  const semProf = agendamentosHoje.filter((a) => !a.profissional_id);

  const byProfAll = [
    ...byProf,
    ...(semProf.length > 0 && profFiltro === "todos"
      ? [{ id: "__sem_prof__", nome: "Sem profissional", items: semProf }]
      : []),
  ];

  /* ── Week view setup ── */
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const dateStr = dateOffset(mondayStr, i);
    const items = agendamentos.filter((a) =>
      a.data === dateStr && (profFiltro === "todos" || a.profissional_id === profFiltro)
    );
    return { label: DIAS_SEMANA[i], dateStr, items, isToday: dateStr === dataAtual };
  });

  /* ── Popover & actions ── */
  function openPopover(
    e: React.MouseEvent<HTMLButtonElement>,
    profId: string, profNome: string,
    data: string, hora: string, horaFim: string,
    estado: "disponivel" | "bloqueado",
    bloqueioId?: string
  ) {
    e.stopPropagation();
    const r = e.currentTarget.getBoundingClientRect();
    setPopover({
      profId, profNome, data, hora, horaFim, estado, bloqueioId,
      top: r.bottom + 4,
      left: Math.min(r.left, window.innerWidth - 190),
    });
  }

  async function handleBloquear() {
    if (!popover) return;
    setActionPending(true);
    const res = await bloquearHorario(popover.data, popover.hora, popover.horaFim, popover.profId);
    setActionPending(false);
    setPopover(null);
    if (!res.error) router.refresh();
  }

  async function handleDesbloquear() {
    if (!popover?.bloqueioId) return;
    setActionPending(true);
    const res = await desbloquearHorario(popover.bloqueioId);
    setActionPending(false);
    setPopover(null);
    if (!res.error) router.refresh();
  }

  const fmtData = new Date(dataAtual + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long",
  });

  return (
    <div>
      <style>{`
        .slot-disp { transition: background 0.1s; }
        .slot-disp:hover { background: var(--brand-50, #f0fdf4) !important; }
        .slot-bloc:hover { filter: brightness(0.94); }
      `}</style>

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between px-5 py-3.5 flex-wrap gap-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium capitalize" style={{ color: "var(--text-primary)" }}>{fmtData}</span>
          <span className="badge badge-gray">{agendamentosHoje.length} hoje</span>
          {profissionais.length > 0 && (
            <select
              value={profFiltro}
              onChange={(e) => setProfFiltro(e.target.value)}
              className="input"
              style={{ width: "auto", padding: "0.25rem 0.5rem", fontSize: "0.8125rem", height: "auto" }}
            >
              <option value="todos">Todos profissionais</option>
              {profissionais.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            {(["dia", "semana"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="px-3 py-1.5 text-xs font-medium capitalize"
                style={{
                  background: view === v ? "var(--brand-800)" : "var(--surface)",
                  color: view === v ? "white" : "var(--text-secondary)",
                  borderRight: v === "dia" ? "1px solid var(--border)" : "none",
                  border: "none", cursor: "pointer",
                }}
              >
                {v}
              </button>
            ))}
          </div>
          <Link href="/agendamentos/novo" className="btn btn-primary" style={{ fontSize: "0.8125rem", padding: "0.4rem 0.75rem" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Agendar
          </Link>
        </div>
      </div>

      {/* ── Popover ── */}
      {popover && (
        <div
          style={{
            position: "fixed", top: popover.top, left: popover.left,
            zIndex: 200, background: "var(--card)",
            border: "1px solid var(--border)", borderRadius: 10,
            boxShadow: "0 4px 20px rgba(0,0,0,0.14)", minWidth: 178, overflow: "hidden",
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div style={{ padding: "0.375rem 0.75rem", borderBottom: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
            <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", fontWeight: 500 }}>
              {popover.hora} · {popover.profNome.split(" ")[0]}
            </p>
          </div>
          <div style={{ padding: "0.375rem" }}>
            {popover.estado === "disponivel" && (
              <>
                <Link
                  href={`/agendamentos/novo?data=${popover.data}&hora=${popover.hora}&profissional_id=${popover.profId}`}
                  onClick={() => setPopover(null)}
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "0.5rem 0.625rem", borderRadius: 6,
                    fontSize: "0.8125rem", color: "var(--text-primary)", textDecoration: "none",
                  }}
                  className="slot-disp"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Agendar
                </Link>
                <button
                  disabled={actionPending}
                  onClick={handleBloquear}
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "0.5rem 0.625rem", borderRadius: 6, width: "100%", textAlign: "left",
                    background: "transparent", border: "none", cursor: "pointer",
                    fontSize: "0.8125rem", color: "var(--text-secondary)",
                    opacity: actionPending ? 0.6 : 1,
                  }}
                >
                  <span style={{ fontSize: "0.875rem" }}>🔒</span>
                  {actionPending ? "Bloqueando..." : "Bloquear horário"}
                </button>
              </>
            )}
            {popover.estado === "bloqueado" && (
              <button
                disabled={actionPending}
                onClick={handleDesbloquear}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "0.5rem 0.625rem", borderRadius: 6, width: "100%", textAlign: "left",
                  background: "transparent", border: "none", cursor: "pointer",
                  fontSize: "0.8125rem", color: "#b91c1c",
                  opacity: actionPending ? 0.6 : 1,
                }}
              >
                <span style={{ fontSize: "0.875rem" }}>🔓</span>
                {actionPending ? "Desbloqueando..." : "Desbloquear"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── VIEW DIÁRIA ── */}
      {view === "dia" && (
        <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 230px)" }}>
          {!horarioDia.ativo ? (
            <div className="flex items-center justify-center" style={{ height: 300 }}>
              <div className="empty-state">
                <p className="empty-state-title">Salão fechado neste dia</p>
                <p className="empty-state-desc">Configure os horários em Configurações.</p>
              </div>
            </div>
          ) : profissionais.length === 0 ? (
            <div className="flex items-center justify-center" style={{ height: 400 }}>
              <div className="empty-state">
                <div className="empty-state-icon">👤</div>
                <p className="empty-state-title">Nenhum profissional cadastrado</p>
                <p className="empty-state-desc">Cadastre profissionais para visualizar a agenda.</p>
              </div>
            </div>
          ) : (
            <div className="flex" style={{ minWidth: byProfAll.length * 220 + 56 }}>
              {/* Coluna de horas */}
              <div className="flex-shrink-0" style={{ width: 56 }}>
                <div style={{ height: 48 }} />
                {gridHours.map((h) => (
                  <div key={h} className="flex items-start justify-end pr-3" style={{ height: 64, borderTop: "1px solid var(--border)" }}>
                    <span style={{ fontSize: "0.6875rem", color: "var(--text-disabled)", marginTop: -8 }}>
                      {String(h).padStart(2, "0")}:00
                    </span>
                  </div>
                ))}
              </div>

              {/* Colunas de profissionais */}
              {byProfAll.map((prof) => (
                <div key={prof.id} className="flex-shrink-0" style={{ width: 220, borderLeft: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-2 px-3" style={{ height: 48, borderBottom: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
                    <div className="avatar avatar-sm avatar-green">{getInitials(prof.nome)}</div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>{prof.nome.split(" ")[0]}</p>
                      <p style={{ fontSize: "0.625rem", color: "var(--text-muted)" }}>{prof.items.length} hoje</p>
                    </div>
                  </div>

                  <div style={{ position: "relative", height: GRID_HEIGHT }}>
                    {/* Linhas de hora */}
                    {gridHours.map((h) => (
                      <div
                        key={h}
                        style={{
                          position: "absolute",
                          top: ((h * 60 - gridStartMin) / 60) * 64,
                          left: 0, right: 0, height: 64,
                          borderTop: "1px solid var(--border)",
                          pointerEvents: "none",
                        }}
                      />
                    ))}

                    {/* Slots interativos — não disponíveis para coluna sem profissional */}
                    {prof.id !== "__sem_prof__" && slotTimes.map((hora) => {
                      const slotMin = timeToMinutes(hora);
                      const topPx = ((slotMin - gridStartMin) / 60) * 64;
                      const resultado = getSlotEstado(prof.id, dataAtual, hora, intervaloAgendamento, agendamentosHoje, bloqueios);

                      if (resultado.estado === "ocupado") return null;

                      const isBloc = resultado.estado === "bloqueado";
                      const bloqueioId = isBloc ? resultado.bloqueioId : undefined;
                      return (
                        <button
                          key={hora}
                          className={isBloc ? "slot-bloc" : "slot-disp"}
                          title={isBloc ? "Bloqueado — clique para desbloquear" : `${hora} — agendar ou bloquear`}
                          onClick={(e) => openPopover(
                            e,
                            prof.id, prof.nome, dataAtual, hora,
                            addMinutes(hora, intervaloAgendamento),
                            resultado.estado,
                            bloqueioId
                          )}
                          style={{
                            position: "absolute", top: topPx, left: 0, right: 0, height: slotHeight,
                            background: isBloc ? "#f3f4f6" : "transparent",
                            border: "none", cursor: "pointer", zIndex: 1,
                            display: "flex", alignItems: "center", paddingLeft: 6,
                          }}
                        >
                          {isBloc && (
                            <span style={{ fontSize: "0.6rem", color: "#9ca3af", display: "flex", alignItems: "center", gap: 3, userSelect: "none" }}>
                              🔒 Bloqueado
                            </span>
                          )}
                        </button>
                      );
                    })}

                    {/* Blocos de agendamentos */}
                    {prof.items.map((a) => {
                      const startMin = timeToMinutes(a.hora?.slice(0, 5) ?? "00:00");
                      const extras = Array.isArray(a.servicos_adicionais) ? a.servicos_adicionais : [];
                      const durExtras = extras.reduce((acc, s) => acc + (s.duracao_min ?? 0), 0);
                      const dur = (a.servicos?.duracao_min ?? 30) + durExtras;
                      const topPx = ((startMin - gridStartMin) / 60) * 64;
                      const heightPx = Math.max((dur / 60) * 64, 28);
                      const colors = statusColor[a.status] ?? statusColor.aguardando;
                      const nomesServicos = [a.servicos?.nome, ...extras.map((s) => s.nome)].filter(Boolean).join(" + ");
                      return (
                        <Link
                          key={a.id}
                          href={`/agendamentos/${a.id}/editar`}
                          style={{
                            position: "absolute",
                            top: topPx, left: 4, right: 4, height: heightPx,
                            background: colors.bg, border: `1px solid ${colors.border}`,
                            borderRadius: 6, padding: "3px 6px", overflow: "hidden",
                            textDecoration: "none", zIndex: 2,
                          }}
                          title={`${a.clientes?.nome} · ${nomesServicos}`}
                        >
                          <p style={{ fontSize: "0.6875rem", fontWeight: 600, color: colors.text, lineHeight: 1.3 }}>
                            {a.hora?.slice(0, 5)} {a.clientes?.nome?.split(" ")[0]}
                          </p>
                          {heightPx > 38 && (
                            <p style={{ fontSize: "0.625rem", color: colors.text, opacity: 0.75, lineHeight: 1.2 }}>
                              {nomesServicos}
                            </p>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {semProf.length > 0 && profFiltro !== "todos" && (
            <div className="px-5 py-3" style={{ borderTop: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
              <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>
                Sem profissional definido ({semProf.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {semProf.map((a) => {
                  const colors = statusColor[a.status] ?? statusColor.aguardando;
                  return (
                    <Link
                      key={a.id}
                      href={`/agendamentos/${a.id}/editar`}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
                      style={{ background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text, textDecoration: "none" }}
                    >
                      <span className="font-medium">{a.hora?.slice(0, 5)}</span>
                      <span>{a.clientes?.nome ?? "—"}</span>
                      <span style={{ opacity: 0.7 }}>· {a.servicos?.nome ?? "—"}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── VIEW SEMANAL ── */}
      {view === "semana" && (
        <div>
          <div className="flex items-center justify-between px-5 py-2.5" style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
            <Link href={`/agenda?data=${prevWeekDate}`} className="btn btn-secondary" style={{ padding: "0.25rem 0.5rem", fontSize: "0.8125rem" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
              Semana anterior
            </Link>
            <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              {new Date(mondayStr + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
              {" – "}
              {new Date(dateOffset(mondayStr, 6) + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" })}
            </span>
            <Link href={`/agenda?data=${nextWeekDate}`} className="btn btn-secondary" style={{ padding: "0.25rem 0.5rem", fontSize: "0.8125rem" }}>
              Próxima semana
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </Link>
          </div>

          <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 270px)" }}>
            <div className="grid" style={{ gridTemplateColumns: `56px repeat(7, 1fr)`, minWidth: 700 }}>
              <div style={{ height: 52 }} />
              {weekDays.map((d) => (
                <Link
                  key={d.dateStr}
                  href={`/agenda?data=${d.dateStr}`}
                  onClick={() => setView("dia")}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    height: 52, borderLeft: "1px solid var(--border)",
                    background: d.isToday ? "var(--brand-50, #f0fdf4)" : "var(--bg-subtle)",
                    textDecoration: "none",
                  }}
                >
                  <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", fontWeight: 500 }}>{d.label}</span>
                  <span style={{ fontSize: "1rem", fontWeight: 700, lineHeight: 1.2, color: d.isToday ? "var(--brand-700, #15803d)" : "var(--text-primary)" }}>
                    {new Date(d.dateStr + "T12:00:00").getDate()}
                  </span>
                  {d.items.length > 0 && (
                    <span style={{ fontSize: "0.625rem", color: d.isToday ? "var(--brand-600)" : "var(--text-muted)" }}>
                      {d.items.length} ag.
                    </span>
                  )}
                </Link>
              ))}

              {WEEK_HOURS.map((h) => (
                <>
                  <div key={`h-${h}`} className="flex items-start justify-end pr-3" style={{ height: 64, borderTop: "1px solid var(--border)" }}>
                    <span style={{ fontSize: "0.6875rem", color: "var(--text-disabled)", marginTop: -8 }}>
                      {String(h).padStart(2, "0")}:00
                    </span>
                  </div>
                  {weekDays.map((d) => {
                    const slotItems = d.items.filter((a) => {
                      const min = timeToMinutes(a.hora?.slice(0, 5) ?? "00:00");
                      return min >= h * 60 && min < (h + 1) * 60;
                    });
                    return (
                      <Link
                        key={`${d.dateStr}-${h}`}
                        href={`/agenda?data=${d.dateStr}`}
                        onClick={() => setView("dia")}
                        style={{
                          display: "block", height: 64,
                          borderLeft: "1px solid var(--border)", borderTop: "1px solid var(--border)",
                          padding: "2px 3px",
                          background: d.isToday ? "var(--brand-50, #f7fdf9)" : "transparent",
                          textDecoration: "none", overflow: "hidden",
                        }}
                        className="slot-disp"
                      >
                        {slotItems.map((a) => {
                          const colors = statusColor[a.status] ?? statusColor.aguardando;
                          return (
                            <div
                              key={a.id}
                              style={{
                                background: colors.bg, border: `1px solid ${colors.border}`,
                                borderRadius: 4, padding: "2px 4px", marginBottom: 1,
                                fontSize: "0.625rem", color: colors.text, fontWeight: 600,
                                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                                lineHeight: 1.4,
                              }}
                            >
                              {a.hora?.slice(0, 5)} {a.clientes?.nome?.split(" ")[0]}
                            </div>
                          );
                        })}
                      </Link>
                    );
                  })}
                </>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
