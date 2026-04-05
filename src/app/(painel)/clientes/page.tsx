import { createClient } from "@/lib/supabase/server";
import Topbar from "@/components/Topbar";
import Link from "next/link";

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

export default async function ClientesPage() {
  const supabase = await createClient();
  const { data: clientes } = await supabase
    .from("clientes")
    .select("*")
    .order("nome");

  return (
    <>
      <Topbar
        title="Clientes"
        subtitle={`${clientes?.length ?? 0} cadastrados`}
        actions={
          <Link href="/clientes/novo" className="btn btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Novo cliente
          </Link>
        }
      />

      <div className="p-6">
        <div className="card overflow-hidden">
          {/* Search */}
          <div className="px-5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input
                type="text"
                placeholder="Buscar por nome, telefone ou e-mail..."
                className="input"
                style={{ paddingLeft: "2.25rem" }}
              />
            </div>
          </div>

          {!clientes || clientes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👥</div>
              <p className="empty-state-title">Nenhum cliente cadastrado</p>
              <p className="empty-state-desc">Comece adicionando o primeiro cliente do seu salão.</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Telefone</th>
                  <th>Última visita</th>
                  <th>Visitas</th>
                  <th>Total gasto</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar avatar-md avatar-green">{getInitials(c.nome)}</div>
                        <div>
                          <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>{c.nome}</p>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{c.email ?? "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-sm" style={{ color: "var(--text-secondary)" }}>{c.telefone ?? "—"}</td>
                    <td className="text-sm" style={{ color: "var(--text-secondary)" }}>{c.ultima_visita ?? "—"}</td>
                    <td className="text-sm" style={{ color: "var(--text-secondary)" }}>{c.total_visitas ?? 0}x</td>
                    <td className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      R$ {Number(c.total_gasto ?? 0).toFixed(2).replace(".", ",")}
                    </td>
                    <td>
                      <Link href={`/clientes/${c.id}`} className="btn btn-ghost" style={{ fontSize: "0.8125rem", padding: "0.25rem 0.625rem" }}>
                        Ver ficha
                      </Link>
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
