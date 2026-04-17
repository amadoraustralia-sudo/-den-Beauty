"use client";

import { useState, useTransition } from "react";
import { toggleSalaoAtivo, deletarSalao } from "../actions";

interface Props {
  salaoId: string;
  ativo: boolean;
  nomeSalao: string;
}

export default function SalaoActions({ salaoId, ativo, nomeSalao }: Props) {
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  function handleToggle() {
    startTransition(() => toggleSalaoAtivo(salaoId, !ativo));
  }

  function handleDelete() {
    if (confirmText !== nomeSalao) return;
    startTransition(() => deletarSalao(salaoId));
  }

  return (
    <>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handleToggle}
          disabled={pending}
          className="btn btn-secondary text-sm"
          style={{ padding: "0.5rem 1rem", ...(ativo ? { color: "var(--warning)", borderColor: "var(--warning)" } : {}) }}
        >
          {pending ? "..." : ativo ? "Suspender" : "Reativar"}
        </button>
        <button
          onClick={() => setConfirmDelete(true)}
          disabled={pending}
          className="btn text-sm"
          style={{ padding: "0.5rem 1rem", background: "var(--danger-bg)", color: "var(--danger)", border: "1px solid #fecaca" }}
        >
          Deletar
        </button>
      </div>

      {/* Modal de confirmação de deleção */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: "white" }}>
            <h2 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>Deletar salão</h2>
            <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
              Esta ação é <strong>irreversível</strong>. Todos os dados do salão serão apagados — clientes, agendamentos, profissionais e histórico financeiro.
            </p>
            <p className="text-sm mb-2" style={{ color: "var(--text-secondary)" }}>
              Digite <strong>{nomeSalao}</strong> para confirmar:
            </p>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={nomeSalao}
              className="input mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setConfirmDelete(false); setConfirmText(""); }}
                className="btn btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={confirmText !== nomeSalao || pending}
                className="btn flex-1"
                style={{
                  background: confirmText === nomeSalao ? "var(--danger)" : "var(--danger-bg)",
                  color: confirmText === nomeSalao ? "white" : "var(--danger)",
                  border: "none",
                  opacity: confirmText !== nomeSalao ? 0.6 : 1,
                }}
              >
                {pending ? "Deletando..." : "Confirmar deleção"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
