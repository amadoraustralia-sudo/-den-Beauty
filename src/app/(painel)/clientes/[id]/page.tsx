import { createClient } from "@/lib/supabase/server";
import { getSalaoId } from "@/lib/supabase/salon";
import Topbar from "@/components/Topbar";
import Link from "next/link";
import { notFound } from "next/navigation";

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

const statusBadge: Record<string, string> = {
  confirmado: "badge badge-green",
  aguardando:  "badge badge-yellow",
  cancelado:   "badge badge-red",
  concluido:   "badge badge-blue",
};

export default async function FichaClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const salao_id = await getSalaoId();

  const [{ data: cliente }, { data: historico }] = await Promise.all([
    supabase
      .from("clientes")
      .select("*, profissionais(nome)")
      .eq("id", id)
      .single(),
    salao_id
      ? supabase
          .from("agendamentos")
          .select("*, servicos(nome, preco), profissionais(nome)")
          .eq("cliente_id", id)
          .eq("salao_id", salao_id)
          .order("data", { ascending: false })
          .order("hora", { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [] }),
  ]);

  if (!cliente) notFound();

  const totalGasto = historico?.filter((h) => h.status === "concluido")
    .reduce((a, h) => a + Number(h.valor ?? h.servicos?.preco ?? 0), 0) ?? 0;
  const totalVisitas = historico?.filter((h) => h.status === "concluido").length ?? 0;

  return (
    <>
      <Topbar
        title="Ficha do cliente"
        subtitle={cliente.nome}
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/agendamentos/novo?cliente=${id}`} className="btn btn-primary" style={{ fontSize: "0.8125rem" }}>
              + Agendar
            </Link>
          </div>
        }
      />

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna esquerda — perfil */}
          <div className="space-y-5">
            {/* Card principal */}
            <div className="card p-6 text-center">
              <div
                className="avatar avatar-lg avatar-green mx-auto mb-3"
                style={{ width: 64, height: 64, fontSize: "1.375rem" }}
              >
                {getInitials(cliente.nome)}
              </div>
              <h2 className="mb-0.5">{cliente.nome}</h2>
              {cliente.email && (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>{cliente.email}</p>
              )}

              <hr className="divider my-4" />

              <div className="grid grid-cols-2 gap-3 text-center">
                <div>
                  <p className="text-xl font-bold" style={{ color: "var(--brand-600)" }}>{totalVisitas}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>visitas</p>
                </div>
                <div>
                  <p className="text-xl font-bold" style={{ color: "var(--brand-600)" }}>
                    R$ {totalGasto.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>total gasto</p>
                </div>
              </div>

              <hr className="divider my-4" />

              <div className="space-y-2.5 text-left">
                {[
                  { label: "Telefone", value: cliente.telefone },
                  { label: "Nascimento", value: cliente.data_nascimento ? new Date(cliente.data_nascimento + "T00:00:00").toLocaleDateString("pt-BR") : null },
                  { label: "Prof. preferido", value: cliente.profissionais?.nome },
                  { label: "Última visita", value: cliente.ultima_visita ? new Date(cliente.ultima_visita + "T00:00:00").toLocaleDateString("pt-BR") : null },
                ].map((item) => item.value && (
                  <div key={item.label} className="flex items-start justify-between gap-2">
                    <span className="text-xs" style={{ color: "var(--text-muted)", flexShrink: 0 }}>{item.label}</span>
                    <span className="text-xs font-medium text-right" style={{ color: "var(--text-primary)" }}>{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                <Link href={`/clientes/${id}/editar`} className="btn btn-secondary w-full" style={{ fontSize: "0.8125rem" }}>
                  Editar dados
                </Link>
              </div>
            </div>

            {/* Preferências */}
            {(cliente.preferencias || cliente.alergias) && (
              <div className="card p-5 space-y-3">
                {cliente.alergias && (
                  <div
                    className="rounded-lg p-3"
                    style={{ background: "var(--danger-bg)", border: "1px solid #FECACA" }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                      <span className="text-xs font-semibold" style={{ color: "var(--danger)" }}>Alergias / Contraindicações</span>
                    </div>
                    <p className="text-xs" style={{ color: "var(--danger)" }}>{cliente.alergias}</p>
                  </div>
                )}
                {cliente.preferencias && (
                  <div>
                    <p className="text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>Preferências</p>
                    <p className="text-sm" style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>{cliente.preferencias}</p>
                  </div>
                )}
              </div>
            )}

            {!cliente.preferencias && !cliente.alergias && (
              <div className="card p-5">
                <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>Preferências e observações</p>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>Nenhuma informação registrada.</p>
                <Link href={`/clientes/${id}/editar`} className="text-xs mt-2 inline-block" style={{ color: "var(--brand-600)" }}>
                  + Adicionar
                </Link>
              </div>
            )}
          </div>

          {/* Coluna direita — histórico */}
          <div className="lg:col-span-2">
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
                <h3>Histórico de atendimentos</h3>
                <span className="badge badge-gray">{totalVisitas} visitas</span>
              </div>

              {!historico || historico.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📋</div>
                  <p className="empty-state-title">Sem atendimentos registrados</p>
                  <p className="empty-state-desc">O histórico aparecerá após o primeiro atendimento.</p>
                </div>
              ) : (
                <div>
                  {historico.map((h, i) => (
                    <div
                      key={h.id}
                      className="flex items-center gap-4 px-5 py-4"
                      style={{ borderBottom: i < historico.length - 1 ? "1px solid var(--border)" : "none" }}
                    >
                      <div className="flex-shrink-0 text-center" style={{ width: 48 }}>
                        <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                          {new Date(h.data + "T00:00:00").getDate()}
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-muted)", textTransform: "uppercase" }}>
                          {new Date(h.data + "T00:00:00").toLocaleDateString("pt-BR", { month: "short" })}
                        </p>
                      </div>

                      <div
                        className="w-px self-stretch flex-shrink-0"
                        style={{ background: "var(--border)" }}
                      />

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                          {h.servicos?.nome ?? "Serviço não informado"}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {h.hora?.slice(0, 5)} · {h.profissionais?.nome ?? "—"}
                        </p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                          {h.valor
                            ? `R$ ${Number(h.valor).toFixed(2).replace(".", ",")}`
                            : h.servicos?.preco
                            ? `R$ ${Number(h.servicos.preco).toFixed(2).replace(".", ",")}`
                            : "—"}
                        </p>
                        <span className={`${statusBadge[h.status] ?? "badge badge-gray"} mt-1`}>
                          {h.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
