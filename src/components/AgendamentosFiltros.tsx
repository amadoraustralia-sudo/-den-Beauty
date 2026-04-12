"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function AgendamentosFiltros() {
  const router = useRouter();
  const params = useSearchParams();
  const filtroStatus = params.get("status") ?? "";
  const filtroData   = params.get("data") ?? "";

  function update(key: string, value: string) {
    const url = new URL(window.location.href);
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
    router.push(url.pathname + url.search);
  }

  return (
    <div className="flex gap-3 px-5 py-3.5 flex-wrap" style={{ borderBottom: "1px solid var(--border)" }}>
      <select
        value={filtroStatus}
        onChange={(e) => update("status", e.target.value)}
        className="input select"
        style={{ width: "auto", minWidth: 160 }}
      >
        <option value="">Todos os status</option>
        <option value="aguardando">Aguardando</option>
        <option value="confirmado">Confirmado</option>
        <option value="concluido">Concluído</option>
        <option value="cancelado">Cancelado</option>
      </select>

      <input
        type="date"
        value={filtroData}
        onChange={(e) => update("data", e.target.value)}
        className="input"
        style={{ width: "auto" }}
      />

      {(filtroStatus || filtroData) && (
        <Link href="/agendamentos" className="btn btn-secondary" style={{ fontSize: "0.8125rem" }}>
          Limpar filtros
        </Link>
      )}
    </div>
  );
}
