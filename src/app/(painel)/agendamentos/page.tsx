import { createClient } from "@/lib/supabase/server";
import Topbar from "@/components/Topbar";
import Link from "next/link";

const statusBadge: Record<string, string> = {
  confirmado: "badge badge-green",
  aguardando:  "badge badge-yellow",
  cancelado:   "badge badge-red",
  concluido:   "badge badge-blue",
};

export default async function AgendamentosPage() {
  const supabase = await createClient();
  const { data: agendamentos } = await supabase
    .from("agendamentos")
    .select("*, clientes(nome), servicos(nome), profissionais(nome)")
    .order("data", { ascending: false })
    .order("hora");

  return (
    <>
      <Topbar
        title="Agendamentos"
        subtitle="Todos os agendamentos do salão"
        actions={
          <Link href="/agendamentos/novo" className="btn btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Novo agendamento
          </Link>
        }
      />

      <div className="p-6">
        <div className="card overflow-hidden">
          {/* Filters */}
          <div className="flex gap-3 px-5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input type="text" placeholder="Buscar cliente ou serviço..." className="input" style={{ paddingLeft: "2.25rem" }} />
            </div>
            <select className="input select" style={{ width: "auto", minWidth: 160 }}>
              <option value="">Todos os status</option>
              <option value="confirmado">Confirmado</option>
              <option value="aguardando">Aguardando</option>
              <option value="concluido">Concluído</option>
              <option value="cancelado">Cancelado</option>
            </select>
            <input type="date" className="input" style={{ width: "auto" }} />
          </div>

          {!agendamentos || agendamentos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📅</div>
              <p className="empty-state-title">Nenhum agendamento ainda</p>
              <p className="empty-state-desc">Crie o primeiro agendamento do seu salão.</p>
            </div>
          ) : (
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
                {agendamentos.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>
                        {new Date(a.data + "T00:00:00").toLocaleDateString("pt-BR")}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{a.hora?.slice(0, 5)}</p>
                    </td>
                    <td className="text-sm" style={{ color: "var(--text-primary)" }}>{a.clientes?.nome ?? "—"}</td>
                    <td className="text-sm" style={{ color: "var(--text-secondary)" }}>{a.servicos?.nome ?? "—"}</td>
                    <td className="text-sm" style={{ color: "var(--text-secondary)" }}>{a.profissionais?.nome ?? "—"}</td>
                    <td className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {a.valor ? `R$ ${Number(a.valor).toFixed(2).replace(".", ",")}` : "—"}
                    </td>
                    <td><span className={statusBadge[a.status] ?? "badge badge-gray"}>{a.status}</span></td>
                    <td>
                      <button className="btn btn-ghost" style={{ fontSize: "0.8125rem", padding: "0.25rem 0.625rem" }}>
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
