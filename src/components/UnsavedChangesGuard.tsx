"use client";

import { useEffect, useRef } from "react";

/**
 * Envolva qualquer <form> com este componente.
 * Ele detecta alterações nos campos e exibe o aviso nativo do browser
 * (beforeunload) se o usuário tentar sair sem salvar.
 */
export default function UnsavedChangesGuard({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dirtyRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const markDirty = () => { dirtyRef.current = true; };
    const clearDirty = () => { dirtyRef.current = false; };

    container.addEventListener("input", markDirty);
    container.addEventListener("change", markDirty);
    // Limpa ao submeter (salvar com sucesso)
    container.addEventListener("submit", clearDirty, true);

    function beforeUnload(e: BeforeUnloadEvent) {
      if (!dirtyRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    }

    window.addEventListener("beforeunload", beforeUnload);

    return () => {
      container.removeEventListener("input", markDirty);
      container.removeEventListener("change", markDirty);
      container.removeEventListener("submit", clearDirty, true);
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, []);

  return <div ref={containerRef}>{children}</div>;
}
