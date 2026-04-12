"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";

type Toast = { id: number; message: string; type: "success" | "error" | "info" };

const MESSAGES: Record<string, { message: string; type: Toast["type"] }> = {
  saved:    { message: "Salvo com sucesso!", type: "success" },
  criado:   { message: "Criado com sucesso!", type: "success" },
  deleted:  { message: "Removido com sucesso!", type: "success" },
  cancelado:{ message: "Agendamento cancelado.", type: "info" },
  status:   { message: "Status atualizado.", type: "success" },
  senha:    { message: "Senha atualizada com sucesso!", type: "success" },
  erro:     { message: "Ocorreu um erro. Tente novamente.", type: "error" },
};

export default function Toaster() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [counter, setCounter] = useState(0);

  const addToast = useCallback((message: string, type: Toast["type"]) => {
    const id = Date.now() + counter;
    setCounter((c) => c + 1);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, [counter]);

  useEffect(() => {
    const toastKey = searchParams.get("toast");
    if (!toastKey) return;

    const config = MESSAGES[toastKey];
    if (config) addToast(config.message, config.type);

    // Remove o param da URL sem recarregar
    const params = new URLSearchParams(searchParams.toString());
    params.delete("toast");
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(newUrl, { scroll: false });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Escuta eventos customizados disparados por componentes client
  useEffect(() => {
    function handleEvent(e: Event) {
      const { message, type } = (e as CustomEvent<{ message: string; type: Toast["type"] }>).detail;
      addToast(message, type ?? "success");
    }
    window.addEventListener("show-toast", handleEvent);
    return () => window.removeEventListener("show-toast", handleEvent);
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "1.5rem",
        right: "1.5rem",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.625rem",
            padding: "0.75rem 1rem",
            borderRadius: "0.625rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            pointerEvents: "auto",
            animation: "toastIn 0.2s ease",
            backgroundColor:
              t.type === "success" ? "var(--success-bg, #f0fdf4)"
              : t.type === "error" ? "var(--danger-bg)"
              : "var(--card)",
            color:
              t.type === "success" ? "#15803d"
              : t.type === "error" ? "var(--danger)"
              : "var(--text-primary)",
            border: `1px solid ${
              t.type === "success" ? "#bbf7d0"
              : t.type === "error" ? "var(--danger)"
              : "var(--border)"
            }`,
          }}
        >
          {t.type === "success" && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
          {t.type === "error" && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          )}
          {t.type === "info" && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          )}
          {t.message}
        </div>
      ))}
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
