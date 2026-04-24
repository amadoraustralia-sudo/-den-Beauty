"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";


export default function CadastroDonoPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nome: "",
    nomeSalao: "",
    email: "",
    telefone: "",
    password: "",
    confirm: "",
  });
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [erros, setErros] = useState<Record<string, string>>({});
  const [aceite, setAceite] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (erros[name]) setErros((prev) => { const n = { ...prev }; delete n[name]; return n; });
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.nomeSalao.trim())   e.nomeSalao = "O nome do estabelecimento é obrigatório.";
    if (!form.nome.trim())        e.nome = "Seu nome é obrigatório.";
    if (!form.email.trim())       e.email = "E-mail é obrigatório.";
    if (form.password.length < 8) e.password = "A senha deve ter no mínimo 8 caracteres.";
    if (form.password !== form.confirm) e.confirm = "As senhas não coincidem.";
    if (!aceite)                  e.aceite = "Você precisa aceitar os termos para continuar.";
    setErros(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setServerError("");

    const supabase = createClient();

    // 1. Cria conta no Auth
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { nome: form.nome, telefone: form.telefone, role: "admin" },
      },
    });

    if (signUpError || !authData.user) {
      setServerError(
        signUpError?.message === "User already registered"
          ? "Este e-mail já está cadastrado."
          : "Erro ao criar conta. Tente novamente."
      );
      setLoading(false);
      return;
    }

    // Salva dados do salão no localStorage para completar após confirmação de e-mail
    localStorage.setItem("pending_salon", JSON.stringify({
      nomeSalao: form.nomeSalao.trim(),
      telefone: form.telefone.trim() || "",
    }));

    router.push("/cadastro/confirmacao");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "var(--bg)" }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--brand-800)" }}>
            <span className="text-xs font-bold" style={{ color: "white" }}>SB</span>
          </div>
          <span className="font-bold text-sm tracking-wide" style={{ color: "var(--text-primary)" }}>Éden Beauty</span>
        </div>

        <div className="mb-7">
          <h2 style={{ fontSize: "1.375rem" }}>Criar conta — Gestor</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Cadastre seu estabelecimento e comece a gerenciar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
          {(() => {
            const errStyle = { borderColor: "var(--danger)", boxShadow: "0 0 0 2px rgb(239 68 68 / 0.15)" };
            return (
              <>
                <div>
                  <label className="label">Nome do estabelecimento <span style={{ color: "var(--danger)" }}>*</span></label>
                  <input name="nomeSalao" value={form.nomeSalao} onChange={handleChange}
                    placeholder="Éden Beauty" className="input" style={erros.nomeSalao ? errStyle : {}} />
                  {erros.nomeSalao && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{erros.nomeSalao}</p>}
                </div>

                <div>
                  <label className="label">Seu nome completo <span style={{ color: "var(--danger)" }}>*</span></label>
                  <input name="nome" value={form.nome} onChange={handleChange}
                    placeholder="Ana Lima" className="input" style={erros.nome ? errStyle : {}} />
                  {erros.nome && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{erros.nome}</p>}
                </div>

                <div>
                  <label className="label">E-mail <span style={{ color: "var(--danger)" }}>*</span></label>
                  <input name="email" type="email" value={form.email} onChange={handleChange}
                    placeholder="seu@email.com" className="input" style={erros.email ? errStyle : {}} />
                  {erros.email && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{erros.email}</p>}
                </div>

                <div>
                  <label className="label">WhatsApp</label>
                  <input name="telefone" value={form.telefone} onChange={handleChange}
                    placeholder="(11) 99999-9999" className="input" />
                </div>

                <div>
                  <label className="label">Senha <span style={{ color: "var(--danger)" }}>*</span></label>
                  <input name="password" type="password" value={form.password} onChange={handleChange}
                    placeholder="Mínimo 8 caracteres" className="input" style={erros.password ? errStyle : {}} />
                  {erros.password && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{erros.password}</p>}
                </div>

                <div>
                  <label className="label">Confirmar senha <span style={{ color: "var(--danger)" }}>*</span></label>
                  <input name="confirm" type="password" value={form.confirm} onChange={handleChange}
                    placeholder="Repita a senha" className="input" style={erros.confirm ? errStyle : {}} />
                  {erros.confirm && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{erros.confirm}</p>}
                </div>

                <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                  <input type="checkbox" checked={aceite}
                    onChange={(e) => {
                      setAceite(e.target.checked);
                      if (e.target.checked) setErros((prev) => { const n = { ...prev }; delete n.aceite; return n; });
                    }}
                    className="mt-0.5 flex-shrink-0"
                    style={{ accentColor: "var(--brand-600)", width: 15, height: 15 }} />
                  <span className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    Concordo com os{" "}
                    <a href="/termos" target="_blank" style={{ color: "var(--brand-600)" }}>Termos de Uso</a>
                    {" "}e autorizo o uso dos meus dados conforme a{" "}
                    <a href="/privacidade" target="_blank" style={{ color: "var(--brand-600)" }}>Política de Privacidade</a>
                    {" "}(LGPD).
                  </span>
                </label>
                {erros.aceite && <p className="text-xs" style={{ color: "var(--danger)" }}>{erros.aceite}</p>}

                {serverError && (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm"
                    style={{ backgroundColor: "var(--danger-bg)", color: "var(--danger)" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {serverError}
                  </div>
                )}

                <button type="submit" disabled={loading} className="btn btn-primary w-full"
                  style={{ padding: "0.625rem 1rem" }}>
                  {loading ? "Criando conta..." : "Criar conta"}
                </button>
              </>
            );
          })()}
        </form>

        <p className="text-center text-sm mt-6" style={{ color: "var(--text-muted)" }}>
          Já tem conta?{" "}
          <Link href="/login" style={{ color: "var(--brand-600)", fontWeight: 500 }}>
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
