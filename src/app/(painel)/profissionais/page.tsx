import { createClient } from "@/lib/supabase/server";
import { getSalaoId } from "@/lib/supabase/salon";
import Topbar from "@/components/Topbar";
import Link from "next/link";
import { redirect } from "next/navigation";

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

export default async function ProfissionaisPage() {
  const supabase = await createClient();
  const salao_id = await getSalaoId();
  if (!salao_id) redirect("/setup-salao");

  const mesAtual = new Date().toISOString().slice(0, 7);

  const { data: profissionais } = await supabase
    .from("profissionais")
    .select("id, nome, cargo, email, especialidades, percentual_comissao, ativo")
    .eq("salao_id", salao_id)
    .order("nome");

  // Para cada profissional, busca métricas do mês
  const metricas: Record<string, { atendimentos: number; faturamento: number; comissao: number }> = {};

  if (profissionais && profissionais.length > 0) {
    const { data: agendamentos } = await supabase
      .from("agendamentos")
      .select("profissional_id, valor, servicos(preco)")
      .eq("salao_id", salao_id)
      .gte("data", `${mesAtual}-01`)
      .eq("status", "concluido");

    profissionais.forEach((p) => {
      const ags = agendamentos?.filter((a) => a.profissional_id === p.id) ?? [];
      const faturamento = ags.reduce((acc, a) => {
        const svc = Array.isArray(a.servicos) ? a.servicos[0] : a.servicos;
        return acc + Number(a.valor ?? (svc as { preco: number } | null)?.preco ?? 0);
      }, 0);
      const comissao = faturamento * ((p.percentual_comissao ?? 50) / 100);
      metricas[p.id] = { atendimentos: ags.length, faturamento, comissao };
    });
  }

  return (
    <>
      <Topbar
        title="Profissionais"
        subtitle={`${profissionais?.length ?? 0} cadastrados`}
        actions={
          <Link href="/profissionais/novo" className="btn btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Novo profissional
          </Link>
        }
      />

      <div className="p-3 lg:p-6">
        {!profissionais || profissionais.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">👤</div>
              <p className="empty-state-title">Nenhum profissional cadastrado</p>
              <p className="empty-state-desc">Adicione os profissionais do seu estabelecimento.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {profissionais.map((p) => {
              const m = metricas[p.id] ?? { atendimentos: 0, faturamento: 0, comissao: 0 };
              return (
                <div key={p.id} className="card p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="avatar avatar-lg avatar-green" style={{ width: 44, height: 44, fontSize: "1rem" }}>
                        {getInitials(p.nome)}
                      </div>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{p.nome}</p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{p.cargo}</p>
                      </div>
                    </div>
                    <span className={`badge ${p.ativo ? "badge-green" : "badge-gray"}`}>
                      {p.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </div>

                  {/* Comissão */}
                  <div
                    className="flex items-center justify-between px-3 py-2 rounded-lg mb-4"
                    style={{ background: "var(--brand-50)", border: "1px solid var(--brand-100)" }}
                  >
                    <span className="text-xs" style={{ color: "var(--brand-700)" }}>Comissão</span>
                    <span className="text-sm font-bold" style={{ color: "var(--brand-700)" }}>
                      {p.percentual_comissao ?? 50}%
                    </span>
                  </div>

                  {/* Métricas do mês */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center">
                      <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{m.atendimentos}</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>atend.</p>
                    </div>
                    <div className="text-center" style={{ borderLeft: "1px solid var(--border)", borderRight: "1px solid var(--border)" }}>
                      <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                        R$ {m.faturamento.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>faturado</p>
                    </div>
                    <div className="text-center">
                      <p className="text-base font-bold" style={{ color: "var(--success)" }}>
                        R$ {m.comissao.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>comissão</p>
                    </div>
                  </div>

                  {/* Especialidades */}
                  {p.especialidades && p.especialidades.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {p.especialidades.slice(0, 4).map((esp: string) => (
                        <span key={esp} className="badge badge-gray" style={{ fontSize: "0.6875rem" }}>{esp}</span>
                      ))}
                      {p.especialidades.length > 4 && (
                        <span className="badge badge-gray" style={{ fontSize: "0.6875rem" }}>+{p.especialidades.length - 4}</span>
                      )}
                    </div>
                  )}

                  {/* Ações */}
                  <div
                    className="flex gap-2 pt-3"
                    style={{ borderTop: "1px solid var(--border)" }}
                  >
                    <Link
                      href={`/profissionais/${p.id}`}
                      className="btn btn-secondary flex-1"
                      style={{ fontSize: "0.8125rem", padding: "0.4rem 0.5rem" }}
                    >
                      Ver perfil
                    </Link>
                    <Link
                      href={`/profissionais/${p.id}/editar`}
                      className="btn btn-ghost flex-1"
                      style={{ fontSize: "0.8125rem", padding: "0.4rem 0.5rem" }}
                    >
                      Editar
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
