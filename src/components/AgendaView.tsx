"use client";

import { useState } from "react";
import Link from "next/link";

interface Agendamento {
  id: string;
  hora: string;
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
}

const statusColor: Record<string, { bg: string; text: string; border: string }> = {
  confirmado: { bg: "#E8F5E9", text: "#2E7D32", border: "#A7D7A9" },
  aguardando:  { bg: "#FEF3C7", text: "#B45309", border: "#FCD34D" },
  concluido:   { bg: "#DBEAFE", text: "#1E40AF", border: "#BFDBFE" },
  cancelado:   { bg: "#FEE2E2", text: "#B91C1C", border: "#FECACA" },
};

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 08:00 – 19:00

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function timeToMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export default function AgendaView({ agendamentos, profissionais, dataAtual }: Props) {
  const [view, setView] = useState<"dia" | "semana">("dia");

  const fmtData = new Date(dataAtual + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long",
  });

  // Agrupa por profissional
  const byProf = profissionais.map((prof) => ({
    ...prof,
    items: agendamentos.filter((a) => a.profissional_id === prof.id),
  }));

  // Conta sem profissional
  const semProf = agendamentos.filter((a) => !a.profissional_id);

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium capitalize" style={{ color: "var(--text-primary)" }}>{fmtData}</span>
          <span className="badge badge-gray">{agendamentos.length} agendamentos</span>
        </div>
        <div className="flex items-center gap-2">
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

      {/* Grade da agenda */}
      <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 200px)" }}>
        <div className="flex" style={{ minWidth: profissionais.length > 0 ? profissionais.length * 220 + 56 : 400 }}>
          {/* Coluna de horas */}
          <div className="flex-shrink-0" style={{ width: 56 }}>
            <div style={{ height: 48 }} /> {/* Header spacer */}
            {HOURS.map((h) => (
              <div
                key={h}
                className="flex items-start justify-end pr-3"
                style={{
                  height: 64,
                  borderTop: "1px solid var(--border)",
                }}
              >
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
              <div
                key={prof.id}
                className="flex-shrink-0"
                style={{ width: 220, borderLeft: "1px solid var(--border)" }}
              >
                {/* Header do profissional */}
                <div
                  className="flex items-center gap-2 px-3"
                  style={{
                    height: 48,
                    borderBottom: "1px solid var(--border)",
                    background: "var(--bg-subtle)",
                  }}
                >
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

                {/* Slots de hora */}
                <div className="relative">
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      style={{
                        height: 64,
                        borderTop: "1px solid var(--border)",
                        position: "relative",
                      }}
                    />
                  ))}

                  {/* Agendamentos posicionados */}
                  {prof.items.map((a) => {
                    const startMin = timeToMinutes(a.hora?.slice(0, 5) ?? "08:00");
                    const dur = a.servicos?.duracao_min ?? 30;
                    const topPx = ((startMin - 480) / 60) * 64; // 480 = 8h em minutos
                    const heightPx = Math.max((dur / 60) * 64, 28);
                    const colors = statusColor[a.status] ?? statusColor.aguardando;

                    return (
                      <div
                        key={a.id}
                        style={{
                          position: "absolute",
                          top: topPx,
                          left: 4,
                          right: 4,
                          height: heightPx,
                          background: colors.bg,
                          border: `1px solid ${colors.border}`,
                          borderRadius: 6,
                          padding: "3px 6px",
                          overflow: "hidden",
                          cursor: "pointer",
                          zIndex: 1,
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

        {/* Agendamentos sem profissional */}
        {semProf.length > 0 && (
          <div className="px-5 py-3" style={{ borderTop: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
            <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>
              Sem profissional definido ({semProf.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {semProf.map((a) => {
                const colors = statusColor[a.status] ?? statusColor.aguardando;
                return (
                  <div
                    key={a.id}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
                    style={{ background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text }}
                  >
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
    </div>
  );
}
