"use client";

import { useEffect } from "react";
import { completarCadastroSalao } from "@/app/cadastro/actions";

export default function SalonSetupGuard() {
  useEffect(() => {
    const raw = localStorage.getItem("pending_salon");
    if (!raw) return;

    try {
      const { nomeSalao, telefone } = JSON.parse(raw);
      if (nomeSalao) {
        completarCadastroSalao(nomeSalao, telefone).then(() => {
          localStorage.removeItem("pending_salon");
        });
      }
    } catch {
      localStorage.removeItem("pending_salon");
    }
  }, []);

  return null;
}
