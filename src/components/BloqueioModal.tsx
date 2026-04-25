"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  profissionalId: string;
  salaoId: string;
  dataInicial?: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function BloqueioModal({ profissionalId, salaoId, dataInicial, onClose, onSaved }: Props) {
  const [fields, setFields] = useState({
    data: dataInicial ?? new Date().toISOString().split("T")[0],
    hora_inicio: "12:00",
    hora_fim: "13:00",
    motivo: "",
  });
  const [pending, setPending] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (fields.hora_inicio >= fields.hora_fim) {
      setErro("Hora de fim deve ser após hora de início."); return;
    }
    setPending(true);
    setErro("");
    const supabase = createClient();
    const { error } = await supabase.from("horarios_bloqueados").insert({
      profissional_id: profissionalId,
      salao_id: salaoId,
      data: fields.data,
      hora_inicio: fields.hora_inicio,
      hora_fim: fields.hora_fim,
      motivo: fields.motivo || null,
    });
    if (error) { setErro("Erro ao salvar bloqueio."); setPending(false); return; }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className="card p-6 w-full max-w-sm" style={{ background: "var(--surface)" }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>Bloquear horário</h3>
          <button type="button" onClick={onClose} style={{ color: "var(--text-muted)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {erro && (
          <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "#fff5f5", border: "1px solid #fecaca", color: "#b91c1c" }}>{erro}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Data</label>
            <input type="date" className="input" value={fields.data}
              onChange={e => setFields(f => ({ ...f, data: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Início</label>
              <input type="time" className="input" value={fields.hora_inicio}
                onChange={e => setFields(f => ({ ...f, hora_inicio: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Fim</label>
              <input type="time" className="input" value={fields.hora_fim}
                onChange={e => setFields(f => ({ ...f, hora_fim: e.target.value }))} required />
            </div>
          </div>
          <div>
            <label className="label">Motivo (opcional)</label>
            <input type="text" className="input" placeholder="Ex: Almoço, Folga…" value={fields.motivo}
              onChange={e => setFields(f => ({ ...f, motivo: e.target.value }))} />
          </div>
          <div className="flex gap-3 justify-end pt-1">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? "Salvando..." : "Confirmar bloqueio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
