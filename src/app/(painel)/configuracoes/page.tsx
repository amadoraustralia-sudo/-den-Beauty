import Topbar from "@/components/Topbar";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { salvarConfiguracoes } from "./actions";
import UnsavedChangesGuard from "@/components/UnsavedChangesGuard";

const DIAS = [
  { key: "seg", label: "Segunda" },
  { key: "ter", label: "Terça" },
  { key: "qua", label: "Quarta" },
  { key: "qui", label: "Quinta" },
  { key: "sex", label: "Sexta" },
  { key: "sab", label: "Sábado" },
  { key: "dom", label: "Domingo" },
];

export default async function ConfiguracoesPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  const supabase = await createClient();

  const [{ data: config }, { data: profissionais }] = await Promise.all([
    supabase.from("configuracoes")
      .select("id, nome_estabelecimento, slug, telefone, email, endereco, horario_abertura, horario_fechamento, dias_funcionamento, intervalo_agendamento, antecedencia_minima_horas, cancelamento_horas")
      .limit(1).single(),
    supabase.from("profissionais")
      .select("id, nome, cargo, email, ativo")
      .order("nome"),
  ]);

  const diasAtivos: string[] = config?.dias_funcionamento ?? ["seg", "ter", "qua", "qui", "sex", "sab"];

  return (
    <>
      <Topbar title="Configurações" subtitle="Dados e preferências do estabelecimento" />

      <div className="p-3 lg:p-6">
        {erro === "nome" && (
          <div className="mb-6 rounded-xl p-4" style={{ background: "#fff5f5", border: "1px solid #fecaca" }}>
            <p className="text-sm" style={{ color: "#b91c1c" }}>O nome do estabelecimento é obrigatório.</p>
          </div>
        )}

        <UnsavedChangesGuard>
        <form action={salvarConfiguracoes}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Coluna principal */}
            <div className="lg:col-span-2 space-y-5">
              {/* Dados do salão */}
              <div className="card p-6">
                <h3 className="mb-4">Dados do estabelecimento</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="label">Nome do estabelecimento *</label>
                    <input name="nome_estabelecimento" className="input" defaultValue={config?.nome_estabelecimento ?? ""} placeholder="Ex: Studio Bella" required />
                  </div>
                  <div>
                    <label className="label">Telefone / WhatsApp</label>
                    <input name="telefone" className="input" defaultValue={config?.telefone ?? ""} placeholder="(11) 99999-9999" />
                  </div>
                  <div>
                    <label className="label">E-mail de contato</label>
                    <input name="email" type="email" className="input" defaultValue={config?.email ?? ""} placeholder="contato@studio.com" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Endereço</label>
                    <input name="endereco" className="input" defaultValue={config?.endereco ?? ""} placeholder="Rua das Flores, 123 — São Paulo, SP" />
                  </div>
                </div>
              </div>

              {/* Agendamento online */}
              <div className="card p-6">
                <h3 className="mb-4">Regras de agendamento</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="label">Intervalo entre slots</label>
                    <select name="intervalo_agendamento" className="input" defaultValue={config?.intervalo_agendamento ?? 30}>
                      {[15, 20, 30, 45, 60].map((v) => (
                        <option key={v} value={v}>{v} min</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Antecedência mínima</label>
                    <select name="antecedencia_minima_horas" className="input" defaultValue={config?.antecedencia_minima_horas ?? 2}>
                      {[1, 2, 4, 8, 12, 24].map((v) => (
                        <option key={v} value={v}>{v}h antes</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Prazo para cancelar</label>
                    <select name="cancelamento_horas" className="input" defaultValue={config?.cancelamento_horas ?? 24}>
                      {[1, 2, 4, 8, 12, 24, 48].map((v) => (
                        <option key={v} value={v}>{v}h antes</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Profissionais */}
              <div className="card overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
                  <h3>Profissionais</h3>
                  <Link href="/profissionais/novo" className="btn btn-secondary" style={{ fontSize: "0.8125rem", padding: "0.375rem 0.75rem" }}>
                    + Adicionar
                  </Link>
                </div>
                {!profissionais || profissionais.length === 0 ? (
                  <div className="empty-state" style={{ padding: "2rem" }}>
                    <p className="empty-state-title">Nenhum profissional cadastrado</p>
                  </div>
                ) : (
                  <div>
                    {profissionais.map((p, i) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between px-5 py-3.5"
                        style={{ borderBottom: i < profissionais.length - 1 ? "1px solid var(--border)" : "none" }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="avatar avatar-md avatar-green">
                            {p.nome.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{p.nome}</p>
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                              {p.cargo ? `${p.cargo} · ` : ""}{p.email ?? ""}
                            </p>
                          </div>
                        </div>
                        <span className={`badge ${p.ativo ? "badge-green" : "badge-gray"}`}>
                          {p.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Coluna lateral */}
            <div className="space-y-5">
              {/* Horário */}
              <div className="card p-5">
                <h3 className="mb-4">Horário de funcionamento</h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="label">Abre às</label>
                    <input type="time" name="horario_abertura" className="input" defaultValue={config?.horario_abertura?.slice(0, 5) ?? "09:00"} />
                  </div>
                  <div>
                    <label className="label">Fecha às</label>
                    <input type="time" name="horario_fechamento" className="input" defaultValue={config?.horario_fechamento?.slice(0, 5) ?? "19:00"} />
                  </div>
                </div>
                <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Dias de funcionamento</p>
                <div className="space-y-2">
                  {DIAS.map((d) => (
                    <label key={d.key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name={`dia_${d.key}`}
                        defaultChecked={diasAtivos.includes(d.key)}
                        style={{ accentColor: "var(--brand-600)", width: 15, height: 15, flexShrink: 0 }}
                      />
                      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{d.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Link de agendamento */}
              {config?.slug && (
                <div className="card p-5">
                  <h3 className="mb-2">Link público</h3>
                  <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                    Compartilhe este link com seus clientes para agendamento online.
                  </p>
                  <div
                    className="rounded-lg px-3 py-2 text-xs font-mono break-all"
                    style={{ background: "var(--surface-raised)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
                  >
                    /agendar
                  </div>
                </div>
              )}

              {/* Salvar */}
              <button type="submit" className="btn btn-primary w-full" style={{ padding: "0.75rem" }}>
                Salvar configurações
              </button>
            </div>
          </div>
        </form>
        </UnsavedChangesGuard>
      </div>
    </>
  );
}
