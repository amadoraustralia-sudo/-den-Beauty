import { createClient } from "@/lib/supabase/server";
import { getSalaoId } from "@/lib/supabase/salon";
import Topbar from "@/components/Topbar";
import Link from "next/link";
import RevenueChart from "@/components/charts/RevenueChart";
import PaymentPieChart from "@/components/charts/PaymentPieChart";
import TopServicosChart from "@/components/charts/TopServicosChart";
import { redirect } from "next/navigation";

const statusBadge: Record<string, string> = {
  confirmado: "badge badge-green",
  aguardando:  "badge badge-yellow",
  cancelado:   "badge badge-red",
  concluido:   "badge badge-blue",
};

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function getDayRange(offsetWeeks = 0) {
  const now = new Date();
  const day = now.getDay();
  const diffToMon = (day === 0 ? -6 : 1 - day) + offsetWeeks * 7;
  const mon = new Date(now); mon.setDate(now.getDate() + diffToMon);
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  return {
    start: mon.toISOString().split("T")[0],
    end:   sun.toISOString().split("T")[0],
  };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const salao_id = await getSalaoId();
  if (!salao_id) redirect("/setup-salao");

  const hoje = new Date().toISOString().split("T")[0];
  const mesAtual = hoje.slice(0, 7);
  const semana = getDayRange(0);
  const semanaAnterior = getDayRange(-1);

  const [
    { count: _totalClientes },
    { data: agendamentosHoje },
    { data: transacoesMes },
    { data: transacoesSemana },
    { data: transacoesAnterior },
    { data: agendamentosSemana },
    { data: clientesInativos },
    { data: agendamentosMes },
  ] = await Promise.all([
    supabase.from("clientes").select("*", { count: "exact", head: true }).eq("salao_id", salao_id),
    supabase.from("agendamentos")
      .select("*, clientes(nome), servicos(nome, preco), profissionais(nome)")
      .eq("salao_id", salao_id).eq("data", hoje).order("hora"),
    supabase.from("transacoes")
      .select("tipo, valor").eq("salao_id", salao_id).gte("data", `${mesAtual}-01`),
    supabase.from("transacoes")
      .select("tipo, valor, data").eq("salao_id", salao_id)
      .gte("data", semana.start).lte("data", semana.end),
    supabase.from("transacoes")
      .select("tipo, valor, data").eq("salao_id", salao_id)
      .gte("data", semanaAnterior.start).lte("data", semanaAnterior.end),
    supabase.from("agendamentos")
      .select("servicos(nome, preco), valor, status").eq("salao_id", salao_id)
      .gte("data", semana.start).lte("data", semana.end),
    supabase.from("clientes")
      .select("id").eq("salao_id", salao_id)
      .lt("ultima_visita", new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0]),
    supabase.from("agendamentos")
      .select("forma_pagamento, valor").eq("salao_id", salao_id)
      .gte("data", `${mesAtual}-01`)
      .eq("status", "concluido"),
  ]);

  // Métricas
  const receitaMes = transacoesMes?.filter((t) => t.tipo === "entrada").reduce((a, t) => a + Number(t.valor), 0) ?? 0;
  const receitaSemana = transacoesSemana?.filter((t) => t.tipo === "entrada").reduce((a, t) => a + Number(t.valor), 0) ?? 0;
  const hoje_count = agendamentosHoje?.length ?? 0;
  const concluidos = agendamentosHoje?.filter((a) => a.status === "concluido").length ?? 0;
  const ticketMedio = hoje_count > 0 ? receitaSemana / (agendamentosSemana?.length || 1) : 0;

  // Gráfico de faturamento semanal
  const diasSemana = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  const chartData = diasSemana.map((dia, i) => {
    const dateStr = new Date(new Date(semana.start + "T12:00:00").getTime() + i * 86400000)
      .toISOString().split("T")[0];
    const dateStrAnt = new Date(new Date(semanaAnterior.start + "T12:00:00").getTime() + i * 86400000)
      .toISOString().split("T")[0];
    return {
      dia,
      receita: transacoesSemana?.filter((t) => t.data === dateStr && t.tipo === "entrada")
        .reduce((a, t) => a + Number(t.valor), 0) ?? 0,
      semanaAnterior: transacoesAnterior?.filter((t) => t.data === dateStrAnt && t.tipo === "entrada")
        .reduce((a, t) => a + Number(t.valor), 0) ?? 0,
    };
  });

  // Top serviços
  const servicosMap: Record<string, number> = {};
  agendamentosSemana?.forEach((a) => {
    const svc = Array.isArray(a.servicos) ? a.servicos[0] : a.servicos;
    const nome = (svc as { nome: string; preco: number } | null)?.nome ?? "Outros";
    const val = Number(a.valor ?? (svc as { nome: string; preco: number } | null)?.preco ?? 0);
    servicosMap[nome] = (servicosMap[nome] ?? 0) + val;
  });
  const topServicos = Object.entries(servicosMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([nome, total]) => ({ nome, total }));

  // Formas de pagamento — dados reais do mês
  const coresPagamento: Record<string, string> = {
    pix: "var(--brand-500)",
    credito: "var(--brand-300)",
    debito: "var(--brand-200)",
    dinheiro: "#D1E8D3",
  };
  const labelsPagamento: Record<string, string> = {
    pix: "Pix",
    credito: "Cartão Crédito",
    debito: "Cartão Débito",
    dinheiro: "Dinheiro",
  };
  const pagamentoMap: Record<string, number> = {};
  (agendamentosMes ?? []).forEach((a) => {
    const key = (a.forma_pagamento ?? "outros").toLowerCase();
    pagamentoMap[key] = (pagamentoMap[key] ?? 0) + 1;
  });
  const totalPag = Object.values(pagamentoMap).reduce((s, v) => s + v, 0) || 1;
  const pagamentos = Object.entries(pagamentoMap).length > 0
    ? Object.entries(pagamentoMap)
        .sort((a, b) => b[1] - a[1])
        .map(([key, count]) => ({
          name: labelsPagamento[key] ?? key.charAt(0).toUpperCase() + key.slice(1),
          value: Math.round((count / totalPag) * 100),
          color: coresPagamento[key] ?? "#e5e7eb",
        }))
    : [{ name: "Sem dados", value: 100, color: "var(--border)" }];

  // Badge de variação semanal
  const receitaAnterior = transacoesAnterior?.filter((t) => t.tipo === "entrada").reduce((a, t) => a + Number(t.valor), 0) ?? 0;
  const variacaoSemanal = receitaAnterior > 0
    ? Math.round(((receitaSemana - receitaAnterior) / receitaAnterior) * 100)
    : null;

  const stats = [
    {
      label: "Agendamentos hoje",
      value: String(hoje_count),
      delta: `${concluidos} concluídos`,
      deltaUp: true,
      href: "/agendamentos",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
    },
    {
      label: "Receita do mês",
      value: `R$ ${receitaMes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      delta: "mês atual",
      deltaUp: true,
      href: "/financeiro",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    },
    {
      label: "Ticket médio",
      value: `R$ ${ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      delta: "esta semana",
      deltaUp: true,
      href: "/relatorios",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>,
    },
    {
      label: "Clientes inativos",
      value: String(clientesInativos?.length ?? 0),
      delta: "há +30 dias",
      deltaUp: false,
      href: "/clientes?inativo=true",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    },
  ];

  return (
    <>
      <Topbar
        title={`Olá, Admin 👋`}
        subtitle={new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        actions={
          <Link href="/agendamentos/novo" className="btn btn-primary" style={{ fontSize: "0.8125rem" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Novo agendamento
          </Link>
        }
      />

      <div className="p-3 lg:p-6 space-y-4 lg:space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <Link key={s.label} href={s.href} className="stat-card" style={{ display: "block", textDecoration: "none", transition: "box-shadow 0.15s" }}>
              <div className="flex items-center justify-between mb-3">
                <p className="stat-label">{s.label}</p>
                <span style={{ color: "var(--brand-400)", opacity: 0.7 }}>{s.icon}</span>
              </div>
              <p className="stat-value">{s.value}</p>
              <p className={`stat-delta ${s.deltaUp ? "stat-delta-up" : "stat-delta-down"}`}>
                {s.delta}
              </p>
            </Link>
          ))}
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Faturamento semanal */}
          <div className="card p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3>Faturamento da semana</h3>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  Comparado com a semana anterior
                </p>
              </div>
              {variacaoSemanal !== null && (
                <span className={`badge ${variacaoSemanal >= 0 ? "badge-green" : "badge-red"}`}>
                  {variacaoSemanal >= 0 ? "+" : ""}{variacaoSemanal}% vs. semana anterior
                </span>
              )}
            </div>
            <RevenueChart data={chartData} />
          </div>

          {/* Formas de pagamento */}
          <div className="card p-5">
            <h3 className="mb-4">Formas de pagamento</h3>
            <PaymentPieChart data={pagamentos} />
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Agenda de hoje */}
          <div className="card overflow-hidden lg:col-span-2">
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <div>
                <h3>Agenda de Hoje</h3>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {hoje_count} {hoje_count === 1 ? "agendamento" : "agendamentos"}
                </p>
              </div>
              <Link href="/agenda" className="btn btn-secondary" style={{ fontSize: "0.8125rem", padding: "0.375rem 0.75rem" }}>
                Ver agenda
              </Link>
            </div>

            {!agendamentosHoje || agendamentosHoje.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <p className="empty-state-title">Nenhum agendamento para hoje</p>
              </div>
            ) : (
              <div>
                {agendamentosHoje.map((a, i) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-4 px-5 py-3"
                    style={{ borderBottom: i < agendamentosHoje.length - 1 ? "1px solid var(--border)" : "none" }}
                  >
                    <span className="text-xs font-mono flex-shrink-0" style={{ color: "var(--text-muted)", width: 38 }}>
                      {a.hora?.slice(0, 5)}
                    </span>
                    <div className="avatar avatar-sm avatar-green flex-shrink-0">
                      {getInitials(a.clientes?.nome ?? "?")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                        {a.clientes?.nome ?? "—"}
                      </p>
                      <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                        {a.servicos?.nome ?? "—"} · {a.profissionais?.nome ?? "—"}
                      </p>
                    </div>
                    {a.servicos?.preco && (
                      <span className="text-xs font-medium flex-shrink-0" style={{ color: "var(--text-secondary)" }}>
                        R$ {Number(a.servicos.preco).toFixed(2).replace(".", ",")}
                      </span>
                    )}
                    <span className={statusBadge[a.status] ?? "badge badge-gray"} style={{ flexShrink: 0 }}>
                      {a.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top serviços */}
          <div className="card p-5">
            <h3 className="mb-4">Top serviços</h3>
            {topServicos.length === 0 ? (
              <div className="empty-state" style={{ padding: "1.5rem" }}>
                <p className="empty-state-desc">Sem dados esta semana</p>
              </div>
            ) : (
              <TopServicosChart data={topServicos} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
