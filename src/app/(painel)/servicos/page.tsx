import { createClient } from "@/lib/supabase/server";
import Topbar from "@/components/Topbar";
import Link from "next/link";

export default async function ServicosPage() {
  const supabase = await createClient();
  const { data: servicos } = await supabase
    .from("servicos")
    .select("*")
    .order("categoria")
    .order("nome");

  const categorias = [...new Set(servicos?.map((s) => s.categoria) ?? [])];

  return (
    <>
      <Topbar
        title="Serviços"
        subtitle="Catálogo de serviços do estabelecimento"
        actions={
          <Link href="/servicos/novo" className="btn btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Novo serviço
          </Link>
        }
      />

      <div className="p-6 space-y-6">
        {servicos?.length === 0 || !servicos ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">✂️</div>
              <p className="empty-state-title">Nenhum serviço cadastrado</p>
              <p className="empty-state-desc">Adicione os serviços que o seu salão oferece.</p>
            </div>
          </div>
        ) : (
          categorias.map((cat) => {
            const items = servicos.filter((s) => s.categoria === cat);
            return (
              <div key={cat}>
                <h4 className="mb-3 px-1" style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {cat}
                </h4>
                <div className="card overflow-hidden">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Serviço</th>
                        <th>Duração</th>
                        <th>Preço</th>
                        <th>Status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((s) => (
                        <tr key={s.id}>
                          <td>
                            <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>{s.nome}</p>
                          </td>
                          <td className="text-sm" style={{ color: "var(--text-secondary)" }}>{s.duracao_min} min</td>
                          <td className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                            R$ {Number(s.preco).toFixed(2).replace(".", ",")}
                          </td>
                          <td>
                            <span className={`badge ${s.ativo ? "badge-green" : "badge-gray"}`}>
                              {s.ativo ? "Ativo" : "Inativo"}
                            </span>
                          </td>
                          <td>
                            <button className="btn btn-ghost" style={{ fontSize: "0.8125rem", padding: "0.25rem 0.625rem" }}>
                              Editar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
