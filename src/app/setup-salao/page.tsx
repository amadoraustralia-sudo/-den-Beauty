"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { completarCadastroSalao } from "@/app/cadastro/actions";

export default function SetupSalaoPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "form" | "saving" | "error">("loading");
  const [nomeSalao, setNomeSalao] = useState("");
  const [telefone, setTelefone] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem("pending_salon");
    if (raw) {
      try {
        const { nomeSalao: nome, telefone: tel } = JSON.parse(raw);
        if (nome) {
          setStatus("saving");
          completarCadastroSalao(nome, tel).then((res) => {
            if (res?.error) {
              setErrorMsg(res.error);
              setStatus("error");
            } else {
              localStorage.removeItem("pending_salon");
              router.replace("/dashboard");
            }
          });
          return;
        }
      } catch {
        localStorage.removeItem("pending_salon");
      }
    }
    setStatus("form");
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nomeSalao.trim()) return;
    setStatus("saving");
    const res = await completarCadastroSalao(nomeSalao.trim(), telefone.trim() || undefined);
    if (res?.error) {
      setErrorMsg(res.error);
      setStatus("form");
    } else {
      router.replace("/dashboard");
    }
  }

  if (status === "loading" || status === "saving") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg)" }}>
        <div className="text-center space-y-3">
          <svg className="animate-spin mx-auto" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--brand-500)" }}>
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {status === "saving" ? "Configurando seu salão..." : "Carregando..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "var(--bg)" }}>
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg mx-auto mb-4"
            style={{ background: "var(--brand-100)", color: "var(--brand-700)" }}>
            ✂
          </div>
          <h1 style={{ fontSize: "1.375rem" }}>Configure seu salão</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Vamos criar o perfil do seu estabelecimento
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nome do estabelecimento</label>
            <input
              type="text"
              required
              value={nomeSalao}
              onChange={(e) => setNomeSalao(e.target.value)}
              placeholder="Ex: Studio Ana Lima"
              className="input"
            />
          </div>
          <div>
            <label className="label">Telefone <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(opcional)</span></label>
            <input
              type="tel"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(00) 00000-0000"
              className="input"
            />
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm"
              style={{ backgroundColor: "var(--danger-bg)", color: "var(--danger)" }}>
              {errorMsg}
            </div>
          )}

          <button type="submit" className="btn btn-primary w-full" style={{ padding: "0.625rem 1rem", marginTop: "0.5rem" }}>
            Criar meu salão
          </button>
        </form>
      </div>
    </div>
  );
}
