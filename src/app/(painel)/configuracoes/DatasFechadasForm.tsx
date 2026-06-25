"use client";

import { useState, useTransition } from "react";
import { adicionarDataFechada, removerDataFechada } from "./actions";

interface DataFechada {
  id: string;
  data: string;
  motivo: string | null;
}

interface Props {
  datasFechadas: DataFechada[];
}

function fmtData(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "short", day: "numeric", month: "long", year: "numeric",
  });
}

export default function DatasFechadasForm({ datasFechadas }: Props) {
  const [erro, setErro] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    const fd = new FormData(e.currentTarget);
    if (!fd.get("data")) { setErro("Selecione uma data"); return; }
    startTransition(async () => {
      const res = await adicionarDataFechada(fd);
      if (res?.error) setErro(res.error);
      else (e.target as HTMLFormElement).reset();
    });
  }

  function handleRemove(id: string) {
    startTransition(async () => {
      await removerDataFechada(id);
    });
  }

  const hoje = new Date().toISOString().split("T")[0];

  return (
    <div className="card" style={{ overflow: "visible" }}>
      <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <h3>Datas fechadas</h3>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
          Feriados, férias ou qualquer data específica em que o salão não funciona
        </p>
      </div>

      <div className="p-4 space-y-3">
        <form onSubmit={handleAdd} className="flex gap-2 flex-wrap">
          <input
            type="date"
            name="data"
            min={hoje}
            className="input"
            style={{ flex: "1 1 140px", minWidth: 140 }}
            required
          />
          <input
            type="text"
            name="motivo"
            placeholder="Motivo (opcional)"
            className="input"
            style={{ flex: "2 1 160px" }}
          />
          <button
            type="submit"
            disabled={isPending}
            className="btn btn-primary"
            style={{ whiteSpace: "nowrap" }}
          >
            {isPending ? "Salvando..." : "+ Adicionar"}
          </button>
        </form>

        {erro && (
          <p className="text-xs" style={{ color: "var(--danger)" }}>{erro}</p>
        )}

        {datasFechadas.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Nenhuma data bloqueada cadastrada.
          </p>
        ) : (
          <div className="space-y-1.5">
            {datasFechadas.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg"
                style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}
              >
                <div>
                  <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {fmtData(d.data)}
                  </span>
                  {d.motivo && (
                    <span className="text-xs ml-2" style={{ color: "var(--text-muted)" }}>
                      — {d.motivo}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(d.id)}
                  disabled={isPending}
                  className="text-xs px-2 py-1 rounded"
                  style={{ background: "none", border: "1px solid var(--border)", color: "var(--danger)", cursor: "pointer" }}
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
