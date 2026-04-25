"use client";

import { useTransition } from "react";
import { excluirTransacao } from "@/app/(painel)/financeiro/[id]/editar/actions";

export default function DeleteTransacaoButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("Excluir este lançamento? Esta ação não pode ser desfeita.")) return;
    const fd = new FormData();
    fd.set("id", id);
    startTransition(() => excluirTransacao(fd));
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="btn btn-ghost"
      style={{ padding: "0.25rem 0.5rem", color: "var(--danger)", fontSize: "0.75rem" }}
      title="Excluir"
    >
      {pending ? (
        <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
      )}
    </button>
  );
}
