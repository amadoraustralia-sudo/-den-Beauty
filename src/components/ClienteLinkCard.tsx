"use client";

import { useState } from "react";

export default function ClienteLinkCard({
  nomeEstabelecimento,
  slug,
}: {
  nomeEstabelecimento: string;
  slug: string;
}) {
  const [copied, setCopied] = useState<"cadastro" | "portal" | null>(null);

  function copy(type: "cadastro" | "portal") {
    const path = type === "cadastro" ? `/${slug}/cadastro` : `/${slug}`;
    const url = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(type);
      setTimeout(() => setCopied(null), 2500);
    });
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div
      className="card p-5"
      style={{ background: "linear-gradient(135deg, var(--brand-800) 0%, var(--brand-600) 100%)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-sm text-white">Link de Clientes</h3>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>
            Compartilhe e receba cadastros direto no salão
          </p>
        </div>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.15)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
        </div>
      </div>

      {/* Links */}
      <div className="space-y-2.5">
        {/* Link de cadastro */}
        <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.1)" }}>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>
              📋 Cadastro de novos clientes
            </span>
            <button
              onClick={() => copy("cadastro")}
              className="text-xs px-2.5 py-1 rounded-lg font-medium transition-all flex-shrink-0"
              style={{
                background: copied === "cadastro" ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.15)",
                color: "white",
              }}
            >
              {copied === "cadastro" ? (
                <span className="flex items-center gap-1">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  Copiado!
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  Copiar
                </span>
              )}
            </button>
          </div>
          <p
            className="text-xs font-mono truncate"
            style={{ color: "rgba(255,255,255,0.85)" }}
            title={`${origin}/${slug}/cadastro`}
          >
            {origin}/{slug}/cadastro
          </p>
        </div>

        {/* Link do portal */}
        <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.1)" }}>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>
              🌐 Página pública do salão
            </span>
            <button
              onClick={() => copy("portal")}
              className="text-xs px-2.5 py-1 rounded-lg font-medium transition-all flex-shrink-0"
              style={{
                background: copied === "portal" ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.15)",
                color: "white",
              }}
            >
              {copied === "portal" ? (
                <span className="flex items-center gap-1">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  Copiado!
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  Copiar
                </span>
              )}
            </button>
          </div>
          <p
            className="text-xs font-mono truncate"
            style={{ color: "rgba(255,255,255,0.85)" }}
            title={`${origin}/${slug}`}
          >
            {origin}/{slug}
          </p>
        </div>
      </div>

      {/* Prévia */}
      <a
        href={`/${slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-medium transition-opacity hover:opacity-80"
        style={{ background: "rgba(255,255,255,0.15)", color: "white" }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        Ver página como cliente
      </a>
    </div>
  );
}
