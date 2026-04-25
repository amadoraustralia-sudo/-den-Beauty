import { createClient } from "@/lib/supabase/server";
import { getSalaoId } from "@/lib/supabase/salon";
import Topbar from "@/components/Topbar";
import Link from "next/link";
import { redirect } from "next/navigation";
import DeleteTransacaoButton from "@/components/DeleteTransacaoButton";

function getMesLabel(mes: string) {
  const [ano, m] = mes.split("-");
  return new Date(Number(ano), Number(m) - 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function getUltimosDiaDoMes(mes: string) {
  const [ano, m] = mes.split("-").map(Number);
  const ultimo = new Date(ano, m, 0).getDate();
  return `${mes}-${String(ultimo).padStart(2, "0")}`;
}

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes: mesParam } = await searchParams;
  const mesAtual = new Date().toISOString().slice(0, 7);
  const mes = mesParam ?? mesAtual;

  const inicio = `${mes}-01`;
  const fim    = getUltimosDiaDoMes(mes);

  const supabase = await createClient();
  const salao_id = await getSalaoId();
  if (!salao_id) redirect("/setup-salao");

  const { data: transacoes } = await supabase
    .from("transacoes")
    .select("id, tipo, descricao, valor, data, categoria")
    .eq("salao_id", salao_id)
    .gte("data", inicio)
    .lte("data", fim)
    .order("data", { ascending: false })
    .order("created_at", { ascending: false });

  const receita  = transacoes?.filter((t) => t.tipo === "entrada").reduce((a, t) => a + Number(t.valor), 0) ?? 0;
  const despesas = transacoes?.filter((t) => t.tipo === "saida").reduce((a, t) => a + Number(t.valor), 0) ?? 0;
  const lucro    = receita - despesas;
  const entradas = transacoes?.filter((t) => t.tipo === "entrada") ?? [];
  const ticketMedio = entradas.length > 0 ? receita / entradas.length : 0;

  // Navegação entre meses
  const [anoN, mesN] = mes.split("-").map(Number);
  const anterior = new Date(anoN, mesN - 2);
  const proximo  = new Date(anoN, mesN);
  const mesAnterior = `${anterior.getFullYear()}-${String(anterior.getMonth() + 1).padStart(2, "0")}`;
  const mesProximo  = `${proximo.getFullYear()}-${String(proximo.getMonth() + 1).padStart(2, "0")}`;
  const podeAvancar = mesProximo <= mesAtual;

  const stats = [
    { label: "Receita", value: `R$ ${receita.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, color: "var(--success)", bg: "var(--success-bg)" },
    { label: "Despesas", value: `R$ ${despesas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, color: "var(--danger)", bg: "var(--danger-bg)" },
    { label: "Lucro estimado", value: `R$ ${lucro.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, color: lucro >= 0 ? "var(--brand-600)" : "var(--danger)", bg: "var(--brand-50)" },
    { label: "Ticket médio", value: `R$ ${ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, color: "var(--text-primary)", bg: "var(--surface-raised)" },
  ];

  return (
    <>
      <Topbar
        title="Financeiro"
        subtitle="Receitas e despesas do estabelecimento"
        actions={
          <Link href="/financeiro/novo" className="btn btn-primary" style={{ fontSize: "0.8125rem" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Novo lançamento
          </Link>
        }
      />

      <div className="p-3 lg:p-6 space-y-4 lg:space-y-6">
        {/* Navegação de mês */}
        <div className="flex items-center justify-between">
          <Link
            href={`/financeiro?mes=${mesAnterior}`}
            className="btn btn-secondary"
            style={{ padding: "0.375rem 0.75rem", fontSize: "0.8125rem" }}
          >
            ← Anterior
          </Link>
          <h2 className="font-semibold capitalize" style={{ color: "var(--text-primary)" }}>
            {getMesLabel(mes)}
          </h2>
          <Link
            href={podeAvancar ? `/financeiro?mes=${mesProximo}` : "#"}
            className="btn btn-secondary"
            style={{
              padding: "0.375rem 0.75rem",
              fontSize: "0.8125rem",
              opacity: podeAvancar ? 1 : 0.4,
              pointerEvents: podeAvancar ? "auto" : "none",
            }}
          >
            Próximo →
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="stat-card" style={{ borderLeft: `3px solid ${s.color}` }}>
              <p className="stat-label">{s.label}</p>
              <p className="stat-value" style={{ fontSize: "1.125rem", color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Lista de transações */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <div>
              <h3>Transações</h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                {transacoes?.length ?? 0} lançamentos em {getMesLabel(mes)}
              </p>
            </div>
          </div>

          {!transacoes || transacoes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💸</div>
              <p className="empty-state-title">Nenhuma transação neste mês</p>
              <p className="empty-state-desc">Registre receitas e despesas para acompanhar o financeiro.</p>
              <Link href="/financeiro/novo" className="btn btn-primary" style={{ marginTop: "1rem", fontSize: "0.8125rem" }}>
                Registrar lançamento
              </Link>
            </div>
          ) : (
            <div>
              {transacoes.map((t, i) => (
                <div
                  key={t.id}
                  className="flex items-center gap-4 px-5 py-3.5"
                  style={{ borderBottom: i < transacoes.length - 1 ? "1px solid var(--border)" : "none" }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: t.tipo === "entrada" ? "var(--success-bg)" : "var(--danger-bg)",
                      color: t.tipo === "entrada" ? "var(--success)" : "var(--danger)",
                    }}
                  >
                    {t.tipo === "entrada" ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                      {t.descricao}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {new Date(t.data + "T00:00:00").toLocaleDateString("pt-BR")}
                      {t.categoria ? ` · ${t.categoria}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span
                      className="text-sm font-semibold"
                      style={{ color: t.tipo === "entrada" ? "var(--success)" : "var(--danger)" }}
                    >
                      {t.tipo === "entrada" ? "+" : "−"}R$ {Number(t.valor).toFixed(2).replace(".", ",")}
                    </span>
                    <Link
                      href={`/financeiro/${t.id}/editar`}
                      className="btn btn-ghost"
                      style={{ padding: "0.25rem 0.5rem", color: "var(--text-muted)", fontSize: "0.75rem" }}
                      title="Editar"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </Link>
                    <DeleteTransacaoButton id={t.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
