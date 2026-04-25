import { createClient } from "@/lib/supabase/server";
import { getSalaoId } from "@/lib/supabase/salon";
import Topbar from "@/components/Topbar";
import Link from "next/link";
import AgendamentoStatusMenu from "@/components/AgendamentoStatusMenu";
import AgendamentosFiltros from "@/components/AgendamentosFiltros";
import { Suspense } from "react";
import { redirect } from "next/navigation";

const statusBadge: Record<string, { cls: string; label: string }> = {
  confirmado: { cls: "badge badge-green",  label: "Confirmado" },
  aguardando: { cls: "badge badge-yellow", label: "Aguardando" },
  cancelado:  { cls: "badge badge-red",    label: "Cancelado"  },
  concluido:  { cls: "badge badge-blue",   label: "Concluído"  },
};

export default async function AgendamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; data?: string; busca?: string }>;
}) {
  const { status: filtroStatus, data: filtroData, busca: filtroBusca } = await searchParams;
  const supabase = await createClient();
  const salao_id = await getSalaoId();
  if (!salao_id) redirect("/setup-salao");

  // Resolve client IDs matching the name search first
  let clienteIds: string[] | null = null;
  if (filtroBusca?.trim()) {
    const { data: clientes } = await supabase
      .from("clientes")
      .select("id")
      .eq("salao_id", salao_id)
      .ilike("nome", `%${filtroBusca.trim()}%`);
    clienteIds = clientes?.map((c) => c.id) ?? [];
  }

  let query = supabase
    .from("agendamentos")
    .select("*, clientes(nome), servicos(nome, preco), profissionais(nome)")
    .eq("salao_id", salao_id)
    .order("data", { ascending: false })
    .order("hora");

  if (filtroStatus)                     query = query.eq("status", filtroStatus);
  if (filtroData)                       query = query.eq("data", filtroData);
  if (clienteIds !== null)              query = clienteIds.length > 0 ? query.in("cliente_id", clienteIds) : query.eq("cliente_id", "00000000-0000-0000-0000-000000000000");

  const { data: agendamentos } = await query;

  return (
    <>
      <Topbar
        title="Agendamentos"
        subtitle="Todos os agendamentos do salão"
        actions={
          <Link href="/agendamentos/novo" className="btn btn-primary" style={{ fontSize: "0.8125rem" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span className="hidden sm:inline">Novo agendamento</span>
            <span className="sm:hidden">Novo</span>
          </Link>
        }
      />

      <div className="p-3 lg:p-6">
        <div className="card overflow-hidden">
          {/* Filtros */}
          <Suspense fallback={<div style={{ height: 56, borderBottom: "1px solid var(--border)" }} />}>
            <AgendamentosFiltros />
          </Suspense>

          {!agendamentos || agendamentos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📅</div>
              <p className="empty-state-title">Nenhum agendamento encontrado</p>
              <p className="empty-state-desc">
                {filtroStatus || filtroData ? "Tente outros filtros." : "Crie o primeiro agendamento do seu salão."}
              </p>
            </div>
          ) : (
            <>
              {/* Tabela — desktop */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Data / Hora</th>
                      <th>Cliente</th>
                      <th>Serviço</th>
                      <th>Profissional</th>
                      <th>Valor</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {agendamentos.map((a) => {
                      const st = statusBadge[a.status] ?? { cls: "badge badge-gray", label: a.status };
                      const valor = a.valor ?? (Array.isArray(a.servicos) ? a.servicos[0]?.preco : (a.servicos as { preco?: number } | null)?.preco);
                      return (
                        <tr key={a.id}>
                          <td>
                            <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>
                              {new Date(a.data + "T00:00:00").toLocaleDateString("pt-BR")}
                            </p>
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{a.hora?.slice(0, 5)}</p>
                          </td>
                          <td className="text-sm" style={{ color: "var(--text-primary)" }}>
                            {(a.clientes as { nome: string } | null)?.nome ?? "—"}
                          </td>
                          <td className="text-sm" style={{ color: "var(--text-secondary)" }}>
                            {Array.isArray(a.servicos) ? a.servicos[0]?.nome : (a.servicos as { nome: string } | null)?.nome ?? "—"}
                          </td>
                          <td className="text-sm" style={{ color: "var(--text-secondary)" }}>
                            {(a.profissionais as { nome: string } | null)?.nome ?? "—"}
                          </td>
                          <td className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                            {valor ? `R$ ${Number(valor).toFixed(2).replace(".", ",")}` : "—"}
                          </td>
                          <td><span className={st.cls}>{st.label}</span></td>
                          <td>
                            <div className="flex items-center gap-1">
                              <Link href={`/agendamentos/${a.id}/editar`} className="btn btn-ghost" style={{ fontSize: "0.8125rem", padding: "0.25rem 0.5rem" }}>Editar</Link>
                              <AgendamentoStatusMenu id={a.id} status={a.status} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Lista compacta — mobile */}
              <div className="lg:hidden">
                {agendamentos.map((a, i) => {
                  const st = statusBadge[a.status] ?? { cls: "badge badge-gray", label: a.status };
                  const valor = a.valor ?? (Array.isArray(a.servicos) ? a.servicos[0]?.preco : (a.servicos as { preco?: number } | null)?.preco);
                  const nomeServico = Array.isArray(a.servicos) ? a.servicos[0]?.nome : (a.servicos as { nome: string } | null)?.nome;
                  return (
                    <div
                      key={a.id}
                      className="flex items-start gap-3 px-4 py-3.5"
                      style={{ borderBottom: i < agendamentos.length - 1 ? "1px solid var(--border)" : "none" }}
                    >
                      <div className="flex-shrink-0 text-center" style={{ minWidth: 44 }}>
                        <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                          {new Date(a.data + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                        </p>
                        <p className="text-xs font-mono" style={{ color: "var(--brand-600)" }}>{a.hora?.slice(0, 5)}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                          {(a.clientes as { nome: string } | null)?.nome ?? "—"}
                        </p>
                        <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                          {nomeServico ?? "—"}{(a.profissionais as { nome: string } | null)?.nome ? ` · ${(a.profissionais as { nome: string }).nome}` : ""}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={st.cls}>{st.label}</span>
                          {valor && (
                            <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                              R$ {Number(valor).toFixed(2).replace(".", ",")}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <AgendamentoStatusMenu id={a.id} status={a.status} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
