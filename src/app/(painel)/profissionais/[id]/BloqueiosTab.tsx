"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import BloqueioModal from "@/components/BloqueioModal";

interface Bloqueio { id: string; data: string; hora_inicio: string; hora_fim: string; motivo: string | null }

export default function BloqueiosTab({ profissionalId, salaoId, bloqueiosIniciais }: {
  profissionalId: string; salaoId: string; bloqueiosIniciais: Bloqueio[];
}) {
  const [bloqueios, setBloqueios] = useState<Bloqueio[]>(bloqueiosIniciais);
  const [modal, setModal] = useState(false);

  async function remover(id: string) {
    const supabase = createClient();
    await supabase.from("horarios_bloqueados").delete().eq("id", id);
    setBloqueios(b => b.filter(x => x.id !== id));
  }

  async function recarregar() {
    const supabase = createClient();
    const { data } = await supabase.from("horarios_bloqueados")
      .select("id, data, hora_inicio, hora_fim, motivo")
      .eq("profissional_id", profissionalId)
      .gte("data", new Date().toISOString().split("T")[0])
      .order("data").order("hora_inicio");
    setBloqueios(data ?? []);
    setModal(false);
  }

  return (
    <>
      {modal && <BloqueioModal profissionalId={profissionalId} salaoId={salaoId} onClose={() => setModal(false)} onSaved={recarregar} />}
      <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <span className="text-sm" style={{ color: "var(--text-muted)" }}>{bloqueios.length} bloqueio(s) futuros</span>
        <button onClick={() => setModal(true)} className="btn btn-secondary" style={{ fontSize: "0.8125rem", padding: "0.375rem 0.75rem" }}>
          + Bloquear horário
        </button>
      </div>
      {bloqueios.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔒</div>
          <p className="empty-state-title">Sem bloqueios futuros</p>
          <p className="empty-state-desc">Bloqueie horários para impedir agendamentos.</p>
        </div>
      ) : (
        <div>
          {bloqueios.map((b, i) => (
            <div key={b.id} className="flex items-center gap-4 px-5 py-3.5"
              style={{ borderBottom: i < bloqueios.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div style={{ minWidth: 64 }}>
                <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                  {new Date(b.data + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                </p>
                <p className="text-xs font-mono" style={{ color: "var(--brand-600)" }}>
                  {b.hora_inicio?.slice(0,5)} – {b.hora_fim?.slice(0,5)}
                </p>
              </div>
              <div className="flex-1">
                <p className="text-sm" style={{ color: b.motivo ? "var(--text-secondary)" : "var(--text-muted)" }}>
                  {b.motivo ?? "Sem motivo"}
                </p>
              </div>
              <button onClick={() => remover(b.id)} className="btn btn-secondary"
                style={{ fontSize: "0.75rem", padding: "0.25rem 0.625rem", color: "var(--danger)" }}>
                Remover
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
