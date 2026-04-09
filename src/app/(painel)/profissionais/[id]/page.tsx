import { createClient } from "@/lib/supabase/server";
import Topbar from "@/components/Topbar";
import Link from "next/link";
import { notFound } from "next/navigation";

const statusBadge: Record<string, { cls: string; label: string }> = {
  confirmado: { cls: "badge badge-green",  label: "Confirmado" },
  aguardando: { cls: "badge badge-yellow", label: "Aguardando" },
  cancelado:  { cls: "badge badge-red",    label: "Cancelado"  },
  concluido:  { cls: "badge badge-blue",   label: "Concluído"  },
};

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

export default async function ProfissionalDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aba?: string; mes?: string }>;
}) {
  const { id } = await params;
  const { aba = "historico", mes } = await searchParams;

  const supabase = await createClient();
  const mesAtual = mes ?? new Date().toISOString().slice(0, 7);
  const mesInicio = `${mesAtual}-01`;

  const [{ data: prof }, { data: agendamentos }, { data: comissoes }] = await Promise.all([
    supabase.from("profissionais").select("*").eq("id", id).single(),
    supabase
      .from("agendamentos")
      .select("id, data, hora, status, valor, clientes(nome), servicos(nome, preco)")
      .eq("profissional_id", id)
      .order("data", { ascending: false })
      .order("hora", { ascending: false }),
    supabase
      .from("comissoes")
      .select("valor_servico, valor_comissao, percentual, data")
      .eq("profissional_id", id)
      .gte("data", mesInicio),
  ]);

  if (!prof) notFound();

  // Métricas gerais
  const totalConcluidos = agendamentos?.filter((a) => a.status === "concluido").length ?? 0;
  const totalFaturado = agendamentos
    ?.filter((a) => a.status === "concluido")
    .reduce((acc, a) => {
      const svc = Array.isArray(a.servicos) ? a.servicos[0] : a.servicos;
      return acc + Number(a.valor ?? (svc as { preco: number } | null)?.preco ?? 0);
    }, 0) ?? 0;

  // Métricas do mês
  const comissaoMes = comissoes?.reduce((acc, c) => acc + Number(c.valor_comissao), 0) ?? 0;
  const servicosMes = comissoes?.reduce((acc, c) => acc + Number(c.valor_servico), 0) ?? 0;
  const atendMes = comissoes?.length ?? 0;

  const mesesDisponiveis = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return d.toISOString().slice(0, 7);
  });

  const tabs = [
    { key: "historico", label: "Histórico" },
    { key: "comissoes", label: "Comissões do mês" },
  ];

  return (
    <>
      <Topbar
        title={prof.nome}
        subtitle={prof.cargo ?? "Profissional"}
        actions={
          <div className="flex gap-2">
            <Link href={`/profissionais/${id}/editar`} className="btn btn-secondary" style={{ fontSize: "0.8125rem", padding: "0.375rem 0.75rem" }}>
              Editar
            </Link>
            <Link href="/profissionais" className="btn btn-secondary" style={{ fontSize: "0.8125rem", padding: "0.375rem 0.75rem" }}>
              ← Voltar
            </Link>
          </div>
        }
      />

      <div className="p-3 lg:p-6">
        {/* Cabeçalho */}
        <div className="card p-5 mb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="avatar avatar-lg avatar-green flex-shrink-0" style={{ width: 56, height: 56, fontSize: "1.25rem" }}>
              {getInitials(prof.nome)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{prof.nome}</h2>
                <span className={`badge ${prof.ativo ? "badge-green" : "badge-gray"}`}>{prof.ativo ? "Ativo" : "Inativo"}</span>
              </div>
              {prof.cargo && <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>{prof.cargo}</p>}
              {prof.email && <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{prof.email}</p>}
            </div>
            <div
              className="flex-shrink-0 px-4 py-2 rounded-xl text-center"
              style={{ background: "var(--brand-50)", border: "1px solid var(--brand-100)" }}
            >
              <p className="text-xl font-bold" style={{ color: "var(--brand-700)" }}>{prof.percentual_comissao ?? 50}%</p>
              <p className="text-xs" style={{ color: "var(--brand-600)" }}>comissão</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-5 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="text-center">
              <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{totalConcluidos}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>atendimentos totais</p>
            </div>
            <div className="text-center" style={{ borderLeft: "1px solid var(--border)", borderRight: "1px solid var(--border)" }}>
              <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                R$ {totalFaturado.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>total faturado</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold" style={{ color: "var(--success)" }}>
                R$ {(totalFaturado * (prof.percentual_comissao ?? 50) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>comissão total</p>
            </div>
          </div>

          {/* Especialidades */}
          {prof.especialidades && prof.especialidades.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {prof.especialidades.map((esp: string) => (
                <span key={esp} className="badge badge-gray">{esp}</span>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="card overflow-hidden">
          <div className="flex" style={{ borderBottom: "1px solid var(--border)" }}>
            {tabs.map((t) => (
              <Link
                key={t.key}
                href={`/profissionais/${id}?aba=${t.key}${mes ? `&mes=${mes}` : ""}`}
                className="px-5 py-3 text-sm font-medium"
                style={{
                  color: aba === t.key ? "var(--brand-600)" : "var(--text-muted)",
                  borderBottom: aba === t.key ? "2px solid var(--brand-600)" : "2px solid transparent",
                  marginBottom: -1,
                  textDecoration: "none",
                }}
              >
                {t.label}
              </Link>
            ))}
          </div>

          {/* Aba: Histórico */}
          {aba === "historico" && (
            <>
              {!agendamentos || agendamentos.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📅</div>
                  <p className="empty-state-title">Nenhum atendimento</p>
                  <p className="empty-state-desc">Ainda não há atendimentos registrados.</p>
                </div>
              ) : (
                <div>
                  {agendamentos.map((a, i) => {
                    const st = statusBadge[a.status] ?? { cls: "badge badge-gray", label: a.status };
                    const svc = Array.isArray(a.servicos) ? a.servicos[0] : a.servicos;
                    const valor = a.valor ?? (svc as { preco: number } | null)?.preco;
                    const nomeServico = (svc as { nome: string } | null)?.nome ?? "—";
                    const nomeCliente = (a.clientes as unknown as { nome: string } | null)?.nome ?? "—";
                    return (
                      <div
                        key={a.id}
                        className="flex items-center gap-4 px-5 py-3.5"
                        style={{ borderBottom: i < agendamentos.length - 1 ? "1px solid var(--border)" : "none" }}
                      >
                        <div className="flex-shrink-0" style={{ minWidth: 56 }}>
                          <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                            {new Date(a.data + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                          </p>
                          <p className="text-xs font-mono" style={{ color: "var(--brand-600)" }}>{a.hora?.slice(0, 5)}</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{nomeCliente}</p>
                          <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{nomeServico}</p>
                        </div>
                        <span className={st.cls}>{st.label}</span>
                        {valor && (
                          <span className="text-sm font-medium flex-shrink-0" style={{ color: "var(--text-secondary)" }}>
                            R$ {Number(valor).toFixed(2).replace(".", ",")}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Aba: Comissões do mês */}
          {aba === "comissoes" && (
            <div>
              {/* Seletor de mês */}
              <div className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Período:</span>
                <div className="flex gap-1 flex-wrap">
                  {mesesDisponiveis.map((m) => (
                    <Link
                      key={m}
                      href={`/profissionais/${id}?aba=comissoes&mes=${m}`}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium"
                      style={{
                        background: mesAtual === m ? "var(--brand-600)" : "var(--surface-raised)",
                        color: mesAtual === m ? "white" : "var(--text-secondary)",
                        textDecoration: "none",
                      }}
                    >
                      {new Date(m + "-15").toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Resumo do mês */}
              <div className="grid grid-cols-3 gap-4 p-5" style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="text-center">
                  <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{atendMes}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>atendimentos</p>
                </div>
                <div className="text-center" style={{ borderLeft: "1px solid var(--border)", borderRight: "1px solid var(--border)" }}>
                  <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                    R$ {servicosMes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>valor serviços</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold" style={{ color: "var(--success)" }}>
                    R$ {comissaoMes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>a receber</p>
                </div>
              </div>

              {/* Lista */}
              {!comissoes || comissoes.length === 0 ? (
                <div className="empty-state">
                  <p className="empty-state-title">Sem comissões neste período</p>
                  <p className="empty-state-desc">Comissões são geradas ao concluir atendimentos.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table" style={{ minWidth: 400 }}>
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Valor serviço</th>
                        <th>%</th>
                        <th>Comissão</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comissoes.map((c, i) => (
                        <tr key={i}>
                          <td className="text-sm" style={{ color: "var(--text-primary)" }}>
                            {new Date(c.data + "T00:00:00").toLocaleDateString("pt-BR")}
                          </td>
                          <td className="text-sm" style={{ color: "var(--text-secondary)" }}>
                            R$ {Number(c.valor_servico).toFixed(2).replace(".", ",")}
                          </td>
                          <td className="text-sm" style={{ color: "var(--text-muted)" }}>{c.percentual}%</td>
                          <td className="text-sm font-semibold" style={{ color: "var(--success)" }}>
                            R$ {Number(c.valor_comissao).toFixed(2).replace(".", ",")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ borderTop: "2px solid var(--border)" }}>
                        <td colSpan={3} className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Total</td>
                        <td className="text-sm font-bold" style={{ color: "var(--success)" }}>
                          R$ {comissaoMes.toFixed(2).replace(".", ",")}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
