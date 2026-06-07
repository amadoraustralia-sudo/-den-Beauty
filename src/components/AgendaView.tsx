"use client";

import { useState } from "react";
import Link from "next/link";

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
}

interface Profissional {
  id: string;
  nome: string;
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
}

const statusColor: Record<string, { bg: string; text: string; border: string }> = {
  confirmado: { bg: "#E8F5E9", text: "#2E7D32", border: "#A7D7A9" },
  aguardando:  { bg: "#FEF3C7", text: "#B45309", border: "#FCD34D" },
  concluido:   { bg: "#DBEAFE", text: "#1E40AF", border: "#BFDBFE" },
  cancelado:   { bg: "#FEE2E2", text: "#B91C1C", border: "#FECACA" },
};

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 08:00–19:00
const DIAS_SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function timeToMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function dateOffset(base: string, days: number) {
  const d = new Date(base + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export default function AgendaView({
  agendamentos,
  profissionais,
  dataAtual,
  mondayStr,
  prevWeekDate,
  nextWeekDate,
  prevDayDate,
  nextDayDate,
}: Props) {
  const [view, setView] = useState<"dia" | "semana">("dia");
  const [profFiltro, setProfFiltro] = useState<string>("todos");

  const fmtData = new Date(dataAtual + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long",
  });

  const agendamentosHoje = agendamentos.filter((a) => a.data === dataAtual);

  // Aplica filtro de profissional
  const filtered = (list: Agendamento[]) =>
    profFiltro === "todos" ? list : list.filter((a) => a.profissional_id === profFiltro);

  // View diária: colunas por profissional
  const byProf = profissionais.map((prof) => ({
    ...prof,
    items: filtered(agendamentosHoje).filter((a) => a.profissional_id === prof.id),
  }));
  const semProf = filtered(agendamentosHoje).filter((a) => !a.profissional_id);

  // View semanal: 7 colunas (seg-dom)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const dateStr = dateOffset(mondayStr, i);
    return {
      label: DIAS_SEMANA[i],
      dateStr,
      items: filtered(agendamentos.filter((a) => a.data === dateStr)),
      isToday: dateStr === dataAtual,
    };
  });

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-3.5 flex-wrap gap-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3">
          {/* Info do dia */}
          <span className="text-sm font-medium capitalize" style={{ color: "var(--text-primary)" }}>{fmtData}</span>
          <span className="badge badge-gray">{agendamentosHoje.length} hoje</span>

          {/* Filtro de profissional */}
          {profissionais.length > 0 && (
            <select
              value={profFiltro}
              onChange={(e) => setProfFiltro(e.target.value)}
              className="input"
              style={{ width: "auto", padding: "0.25rem 0.5rem", fontSize: "0.8125rem", height: "auto" }}
            >
              <option value="todos">Todos profissionais</option>
              {profissionais.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle de view */}
          <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            {(["dia", "semana"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="px-3 py-1.5 text-xs font-medium capitalize transition-colors"
                style={{
                  background: view === v ? "var(--brand-800)" : "var(--surface)",
                  color: view === v ? "white" : "var(--text-secondary)",
                  borderRight: v === "dia" ? "1px solid var(--border)" : "none",
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

      {/* ── VIEW DIÁRIA ── */}
      {view === "dia" && (
        <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 230px)" }}>
          <div className="flex" style={{ minWidth: profissionais.length > 0 ? profissionais.length * 220 + 56 : 400 }}>
            {/* Coluna de horas */}
            <div className="flex-shrink-0" style={{ width: 56 }}>
              <div style={{ height: 48 }} />
              {HOURS.map((h) => (
                <div key={h} className="flex items-start justify-end pr-3" style={{ height: 64, borderTop: "1px solid var(--border)" }}>
                  <span style={{ fontSize: "0.6875rem", color: "var(--text-disabled)", marginTop: -8 }}>
                    {String(h).padStart(2, "0")}:00
                  </span>
                </div>
              ))}
            </div>

            {/* Colunas de profissionais */}
            {profissionais.length === 0 ? (
              <div className="flex-1 flex items-center justify-center" style={{ height: 400 }}>
                <div className="empty-state">
                  <div className="empty-state-icon">👤</div>
                  <p className="empty-state-title">Nenhum profissional cadastrado</p>
                  <p className="empty-state-desc">Cadastre profissionais para visualizar a agenda.</p>
                </div>
              </div>
            ) : (
              byProf.map((prof) => (
                <div key={prof.id} className="flex-shrink-0" style={{ width: 220, borderLeft: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-2 px-3" style={{ height: 48, borderBottom: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
                    <div className="avatar avatar-sm avatar-green">{getInitials(prof.nome)}</div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                        {prof.nome.split(" ")[0]}
                      </p>
                      <p style={{ fontSize: "0.625rem", color: "var(--text-muted)" }}>
                        {prof.items.length} hoje
                      </p>
                    </div>
                  </div>

                  <div className="relative">
                    {HOURS.map((h) => (
                      <Link
                        key={h}
                        href={`/agendamentos/novo?data=${dataAtual}&hora=${String(h).padStart(2, "0")}:00&profissional_id=${prof.id}`}
                        style={{ display: "block", height: 64, borderTop: "1px solid var(--border)" }}
                        title={`Agendar ${String(h).padStart(2, "0")}:00 com ${prof.nome}`}
                      />
                    ))}

                    {prof.items.map((a) => {
                      const startMin = timeToMinutes(a.hora?.slice(0, 5) ?? "08:00");
                      const dur = a.servicos?.duracao_min ?? 30;
                      const topPx = ((startMin - 480) / 60) * 64;
                      const heightPx = Math.max((dur / 60) * 64, 28);
                      const colors = statusColor[a.status] ?? statusColor.aguardando;
                      return (
                        <div
                          key={a.id}
                          style={{
                            position: "absolute",
                            top: topPx, left: 4, right: 4, height: heightPx,
                            background: colors.bg, border: `1px solid ${colors.border}`,
                            borderRadius: 6, padding: "3px 6px", overflow: "hidden",
                            cursor: "pointer", zIndex: 1,
                          }}
                          title={`${a.clientes?.nome} · ${a.servicos?.nome}`}
                        >
                          <p style={{ fontSize: "0.6875rem", fontWeight: 600, color: colors.text, lineHeight: 1.3 }}>
                            {a.hora?.slice(0, 5)} {a.clientes?.nome?.split(" ")[0]}
                          </p>
                          {heightPx > 38 && (
                            <p style={{ fontSize: "0.625rem", color: colors.text, opacity: 0.75, lineHeight: 1.2 }}>
                              {a.servicos?.nome}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {semProf.length > 0 && (
            <div className="px-5 py-3" style={{ borderTop: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
              <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>
                Sem profissional definido ({semProf.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {semProf.map((a) => {
                  const colors = statusColor[a.status] ?? statusColor.aguardando;
                  return (
                    <div key={a.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
                      style={{ background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text }}>
                      <span className="font-medium">{a.hora?.slice(0, 5)}</span>
                      <span>{a.clientes?.nome ?? "—"}</span>
                      <span style={{ opacity: 0.7 }}>· {a.servicos?.nome ?? "—"}</span>
                    </div>
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
          {/* Navegação semanal */}
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
              {/* Header linha de dias */}
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
                    cursor: "pointer",
                  }}
                >
                  <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", fontWeight: 500 }}>{d.label}</span>
                  <span style={{
                    fontSize: "1rem", fontWeight: 700, lineHeight: 1.2,
                    color: d.isToday ? "var(--brand-700, #15803d)" : "var(--text-primary)",
                  }}>
                    {new Date(d.dateStr + "T12:00:00").getDate()}
                  </span>
                  {d.items.length > 0 && (
                    <span style={{ fontSize: "0.625rem", color: d.isToday ? "var(--brand-600)" : "var(--text-muted)" }}>
                      {d.items.length} ag.
                    </span>
                  )}
                </Link>
              ))}

              {/* Grade horária */}
              {HOURS.map((h) => (
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
                      <div
                        key={`${d.dateStr}-${h}`}
                        style={{
                          height: 64,
                          borderLeft: "1px solid var(--border)",
                          borderTop: "1px solid var(--border)",
                          padding: "2px 3px",
                          background: d.isToday ? "var(--brand-50, #f7fdf9)" : "transparent",
                          position: "relative",
                          overflow: "hidden",
                        }}
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
                              title={`${a.hora?.slice(0, 5)} ${a.clientes?.nome} · ${a.servicos?.nome}`}
                            >
                              {a.hora?.slice(0, 5)} {a.clientes?.nome?.split(" ")[0]}
                            </div>
                          );
                        })}
                      </div>
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
