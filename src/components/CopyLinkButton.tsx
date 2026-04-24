"use client";

import { useState } from "react";

export default function CopyLinkButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    const url = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="space-y-2">
      <div
        className="rounded-lg px-3 py-2 text-xs font-mono break-all"
        style={{ background: "var(--surface-raised)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
      >
        {typeof window !== "undefined" ? `${window.location.origin}${path}` : path}
      </div>
      <button
        onClick={copy}
        className="btn btn-secondary w-full"
        style={{ fontSize: "0.8125rem", padding: "0.375rem 0.75rem" }}
      >
        {copied ? (
          <span className="flex items-center justify-center gap-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Copiado!
          </span>
        ) : (
          <span className="flex items-center justify-center gap-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copiar link
          </span>
        )}
      </button>
    </div>
  );
}
