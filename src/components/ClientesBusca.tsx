"use client";

import { useState, useDeferredValue } from "react";
import Link from "next/link";

interface Cliente {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  total_visitas: number | null;
  ultima_visita: string | null;
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

export default function ClientesBusca({ clientes, filtroInativo }: { clientes: Cliente[]; filtroInativo?: boolean }) {
  const [busca, setBusca] = useState("");
  const buscaDeferred = useDeferredValue(busca);

  const filtrados = buscaDeferred.trim()
    ? clientes.filter((c) => {
        const q = buscaDeferred.toLowerCase();
        return (
          c.nome.toLowerCase().includes(q) ||
          c.telefone?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q)
        );
      })
    : clientes;

  return (
    <>
      {/* Banner de filtro inativo */}
      {filtroInativo && (
        <div className="flex items-center justify-between px-5 py-2.5" style={{ background: "var(--danger-bg)", borderBottom: "1px solid var(--border)" }}>
          <span className="text-xs font-medium" style={{ color: "var(--danger)" }}>
            Mostrando apenas clientes inativos (sem visita há mais de 30 dias)
          </span>
          <a href="/clientes" className="text-xs font-medium" style={{ color: "var(--danger)" }}>
            Ver todos
          </a>
        </div>
      )}

      {/* Barra de busca */}
      <div className="flex gap-3 px-5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, telefone ou e-mail..."
            className="input"
            style={{ paddingLeft: "2.25rem" }}
          />
        </div>
        {busca && (
          <button onClick={() => setBusca("")} className="btn btn-secondary" style={{ fontSize: "0.8125rem", padding: "0.375rem 0.75rem" }}>
            Limpar
          </button>
        )}
      </div>

      {/* Lista */}
      {filtrados.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <p className="empty-state-title">
            {busca ? `Nenhum cliente encontrado para "${busca}"` : "Nenhum cliente cadastrado"}
          </p>
          {!busca && <p className="empty-state-desc">Comece cadastrando o primeiro cliente do seu salão.</p>}
        </div>
      ) : (
        <div>
          {filtrados.map((c, i) => (
            <Link
              key={c.id}
              href={`/clientes/${c.id}`}
              className="flex items-center gap-4 px-5 py-3.5 transition-colors"
              style={{
                borderBottom: i < filtrados.length - 1 ? "1px solid var(--border)" : "none",
                display: "flex",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-raised)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div className="avatar avatar-md avatar-green flex-shrink-0">
                {getInitials(c.nome)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{c.nome}</p>
                <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                  {[c.telefone, c.email].filter(Boolean).join(" · ") || "Sem contato cadastrado"}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                  {c.total_visitas ?? 0} {(c.total_visitas ?? 0) === 1 ? "visita" : "visitas"}
                </p>
                {c.ultima_visita && (
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {new Date(c.ultima_visita + "T12:00:00").toLocaleDateString("pt-BR")}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
