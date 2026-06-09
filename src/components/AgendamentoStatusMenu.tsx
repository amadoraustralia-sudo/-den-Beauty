"use client";

import { useState, useTransition } from "react";
import { atualizarStatusAgendamento } from "@/app/(painel)/agendamentos/actions";

const TRANSICOES: Record<string, { label: string; status: "aguardando" | "confirmado" | "concluido" | "cancelado"; color: string }[]> = {
  aguardando: [
    { label: "Confirmar",  status: "confirmado", color: "var(--success)" },
    { label: "Cancelar",   status: "cancelado",  color: "var(--danger)"  },
  ],
  confirmado: [
    { label: "Concluir",   status: "concluido",  color: "var(--info)"    },
    { label: "Cancelar",   status: "cancelado",  color: "var(--danger)"  },
  ],
  concluido: [
    { label: "Reabrir",    status: "aguardando", color: "var(--brand-600)" },
  ],
  cancelado: [
    { label: "Reabrir",    status: "aguardando", color: "var(--brand-600)" },
  ],
};

export default function AgendamentoStatusMenu({ id, status }: { id: string; status: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const acoes = TRANSICOES[status] ?? [];

  if (acoes.length === 0) return null;

  function handleAcao(novoStatus: "aguardando" | "confirmado" | "concluido" | "cancelado") {
    setOpen(false);
    startTransition(async () => {
      const result = await atualizarStatusAgendamento(id, novoStatus);
      window.dispatchEvent(new CustomEvent("show-toast", {
        detail: result?.error
          ? { message: "Erro ao atualizar status. Tente novamente.", type: "error" }
          : { message: "Status atualizado.", type: "success" },
      }));
    });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        className="btn btn-ghost"
        style={{ fontSize: "0.8125rem", padding: "0.25rem 0.625rem" }}
      >
        {isPending ? "..." : "Ações ▾"}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 z-20 rounded-xl overflow-hidden"
            style={{
              top: "calc(100% + 4px)",
              minWidth: 140,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              boxShadow: "0 4px 16px rgb(0 0 0 / 0.1)",
            }}
          >
            {acoes.map((a) => (
              <button
                key={a.status}
                onClick={() => handleAcao(a.status)}
                className="w-full text-left px-4 py-2.5 text-sm transition-colors"
                style={{ color: a.color }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-raised)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {a.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
