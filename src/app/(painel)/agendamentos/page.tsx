import { createClient } from "@/lib/supabase/server";
import Topbar from "@/components/Topbar";
import Link from "next/link";
import AgendamentoStatusMenu from "@/components/AgendamentoStatusMenu";
import AgendamentosFiltros from "@/components/AgendamentosFiltros";
import { Suspense } from "react";

const statusBadge: Record<string, { cls: string; label: string }> = {
  confirmado: { cls: "badge badge-green",  label: "Confirmado" },
  aguardando: { cls: "badge badge-yellow", label: "Aguardando" },
  cancelado:  { cls: "badge badge-red",    label: "Cancelado"  },
  concluido:  { cls: "badge badge-blue",   label: "Concluído"  },
};

export default async function AgendamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; data?: string }>;
}) {
  const { status: filtroStatus, data: filtroData } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("agendamentos")
    .select("*, clientes(nome), servicos(nome, preco), profissionais(nome)")
    .order("data", { ascending: false })
    .order("hora");

  if (filtroStatus) query = query.eq("status", filtroStatus);
  if (filtroData)   query = query.eq("data", filtroData);

  const { data: agendamentos } = await query;

  return (
    <>
      <Topbar
        title="Agendamentos"
        subtitle="Todos os agendamentos do salão"
        actions={
          <Link href="/agendamentos/novo" className="btn btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Novo agendamento
          </Link>
        }
      />

      <div className="p-6">
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
            <div className="overflow-x-auto">
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
                        <td>
                          <span className={st.cls}>{st.label}</span>
                        </td>
                        <td>
                          <AgendamentoStatusMenu id={a.id} status={a.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
