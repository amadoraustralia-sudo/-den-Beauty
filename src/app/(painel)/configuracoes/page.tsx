import Topbar from "@/components/Topbar";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { salvarConfiguracoes } from "./actions";
import UnsavedChangesGuard from "@/components/UnsavedChangesGuard";
import CopyLinkButton from "@/components/CopyLinkButton";
import PhoneInput from "@/components/PhoneInput";

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
  const horariosSemana: Record<string, { ativo: boolean; abre: string; fecha: string; intervalo_inicio?: string; intervalo_fim?: string }> =
    (config as any)?.horarios_semana ?? {};

  const getHorarioDia = (key: string) => ({
    ativo: horariosSemana[key]?.ativo ?? diasAtivos.includes(key),
    abre: horariosSemana[key]?.abre ?? config?.horario_abertura?.slice(0, 5) ?? "09:00",
    fecha: horariosSemana[key]?.fecha ?? config?.horario_fechamento?.slice(0, 5) ?? "19:00",
    intervalo_inicio: horariosSemana[key]?.intervalo_inicio ?? "",
    intervalo_fim: horariosSemana[key]?.intervalo_fim ?? "",
  });

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
                    <PhoneInput name="telefone" defaultValue={config?.telefone ?? ""} />
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
              {/* Horário por dia */}
              <div className="card overflow-hidden">
                <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
                  <h3>Horário de funcionamento</h3>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Configure por dia da semana</p>
                </div>
                <div className="overflow-x-auto">
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border)" }}>
                        {["Dia","Ativo","Abre","Fecha","Intervalo"].map(h => (
                          <th key={h} className="text-xs" style={{ padding: "0.5rem 0.75rem", color: "var(--text-muted)", fontWeight: 500, textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {DIAS.map((d, i) => {
                        const h = getHorarioDia(d.key);
                        return (
                          <tr key={d.key} style={{ borderBottom: i < DIAS.length - 1 ? "1px solid var(--border)" : "none" }}>
                            <td className="text-sm" style={{ padding: "0.5rem 0.75rem", color: "var(--text-secondary)", fontWeight: 500, whiteSpace: "nowrap" }}>{d.label}</td>
                            <td style={{ padding: "0.5rem 0.75rem" }}>
                              <input type="checkbox" name={`horario_${d.key}_ativo`} defaultChecked={h.ativo}
                                style={{ accentColor: "var(--brand-600)", width: 15, height: 15 }} />
                            </td>
                            <td style={{ padding: "0.375rem 0.5rem" }}>
                              <input type="time" name={`horario_${d.key}_abre`} defaultValue={h.abre}
                                className="input" style={{ padding: "0.25rem 0.375rem", fontSize: "0.8125rem", width: 90 }} />
                            </td>
                            <td style={{ padding: "0.375rem 0.5rem" }}>
                              <input type="time" name={`horario_${d.key}_fecha`} defaultValue={h.fecha}
                                className="input" style={{ padding: "0.25rem 0.375rem", fontSize: "0.8125rem", width: 90 }} />
                            </td>
                            <td style={{ padding: "0.375rem 0.5rem" }}>
                              <div className="flex items-center gap-1">
                                <input type="time" name={`horario_${d.key}_int_inicio`} defaultValue={h.intervalo_inicio}
                                  className="input" style={{ padding: "0.25rem 0.375rem", fontSize: "0.8125rem", width: 82 }} placeholder="—" />
                                <span className="text-xs" style={{ color: "var(--text-muted)" }}>-</span>
                                <input type="time" name={`horario_${d.key}_int_fim`} defaultValue={h.intervalo_fim}
                                  className="input" style={{ padding: "0.25rem 0.375rem", fontSize: "0.8125rem", width: 82 }} placeholder="—" />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Link de agendamento */}
              <div className="card p-5">
                <h3 className="mb-2">Link público</h3>
                <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                  Compartilhe este link com seus clientes para agendamento online.
                </p>
                <CopyLinkButton path={config?.slug ? `/${config.slug}` : "/agendar"} />
              </div>

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
