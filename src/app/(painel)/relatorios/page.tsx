import { createClient } from "@/lib/supabase/server";
import Topbar from "@/components/Topbar";
import Link from "next/link";

function getPeriodo(periodo: string): { inicio: string; fim: string; label: string } {
  const hoje = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (periodo === "7d") {
    const ini = new Date(hoje); ini.setDate(hoje.getDate() - 6);
    return { inicio: fmt(ini), fim: fmt(hoje), label: "Últimos 7 dias" };
  }
  if (periodo === "30d") {
    const ini = new Date(hoje); ini.setDate(hoje.getDate() - 29);
    return { inicio: fmt(ini), fim: fmt(hoje), label: "Últimos 30 dias" };
  }
  if (periodo === "90d") {
    const ini = new Date(hoje); ini.setDate(hoje.getDate() - 89);
    return { inicio: fmt(ini), fim: fmt(hoje), label: "Últimos 90 dias" };
  }
  // mes atual (default)
  const mesStr = `${hoje.getFullYear()}-${pad(hoje.getMonth() + 1)}`;
  const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
  return {
    inicio: `${mesStr}-01`,
    fim: `${mesStr}-${ultimoDia}`,
    label: hoje.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
  };
}

const PERIODOS = [
  { val: "mes", label: "Este mês" },
  { val: "7d",  label: "7 dias" },
  { val: "30d", label: "30 dias" },
  { val: "90d", label: "90 dias" },
];

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const { periodo: periodoParam } = await searchParams;
  const periodoKey = periodoParam ?? "mes";
  const { inicio, fim, label } = getPeriodo(periodoKey);

  const supabase = await createClient();

  const [
    { data: agendamentos },
    { data: transacoes },
    { data: profissionais },
  ] = await Promise.all([
    supabase.from("agendamentos")
      .select("*, servicos(nome, preco), profissionais(nome), clientes(nome)")
      .gte("data", inicio).lte("data", fim)
      .order("data", { ascending: false }),
    supabase.from("transacoes")
      .select("*").gte("data", inicio).lte("data", fim),
    supabase.from("profissionais").select("id, nome").eq("ativo", true),
  ]);

  // Métricas gerais
  const totalAgendamentos = agendamentos?.length ?? 0;
  const concluidos = agendamentos?.filter((a) => a.status === "concluido").length ?? 0;
  const cancelados = agendamentos?.filter((a) => a.status === "cancelado").length ?? 0;
  const taxaConclusao = totalAgendamentos > 0 ? Math.round((concluidos / totalAgendamentos) * 100) : 0;

  const receita  = transacoes?.filter((t) => t.tipo === "entrada").reduce((a, t) => a + Number(t.valor), 0) ?? 0;
  const despesas = transacoes?.filter((t) => t.tipo === "saida").reduce((a, t) => a + Number(t.valor), 0) ?? 0;
  const lucro    = receita - despesas;
  const ticketMedio = concluidos > 0 ? receita / concluidos : 0;

  // Top serviços
  const servicosMap: Record<string, { count: number; receita: number }> = {};
  agendamentos?.forEach((a) => {
    const nome = a.servicos?.nome ?? "Outros";
    if (!servicosMap[nome]) servicosMap[nome] = { count: 0, receita: 0 };
    servicosMap[nome].count++;
    if (a.status === "concluido") {
      servicosMap[nome].receita += Number(a.valor ?? a.servicos?.preco ?? 0);
    }
  });
  const topServicos = Object.entries(servicosMap)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 6)
    .map(([nome, d]) => ({ nome, ...d }));

  // Por profissional
  const profMap: Record<string, { count: number; concluidos: number }> = {};
  agendamentos?.forEach((a) => {
    const nome = a.profissionais?.nome ?? "Sem profissional";
    if (!profMap[nome]) profMap[nome] = { count: 0, concluidos: 0 };
    profMap[nome].count++;
    if (a.status === "concluido") profMap[nome].concluidos++;
  });
  const porProfissional = Object.entries(profMap)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([nome, d]) => ({ nome, ...d }));

  // Clientes únicos atendidos
  const clientesSet = new Set(agendamentos?.filter((a) => a.status === "concluido").map((a) => a.cliente_id));
  const clientesAtendidos = clientesSet.size;

  const stats = [
    { label: "Agendamentos", value: String(totalAgendamentos), sub: `${concluidos} concluídos` },
    { label: "Taxa de conclusão", value: `${taxaConclusao}%`, sub: `${cancelados} cancelados` },
    { label: "Receita", value: `R$ ${receita.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, sub: `Lucro: R$ ${lucro.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` },
    { label: "Ticket médio", value: `R$ ${ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, sub: `${clientesAtendidos} clientes atendidos` },
  ];

  return (
    <>
      <Topbar
        title="Relatórios"
        subtitle={`Análise de desempenho — ${label}`}
      />

      <div className="p-6 space-y-6">
        {/* Seletor de período */}
        <div className="flex gap-2 flex-wrap">
          {PERIODOS.map((p) => (
            <Link
              key={p.val}
              href={`/relatorios?periodo=${p.val}`}
              className="btn"
              style={{
                fontSize: "0.8125rem",
                padding: "0.375rem 0.875rem",
                background: periodoKey === p.val ? "var(--brand-600)" : "var(--surface)",
                color: periodoKey === p.val ? "white" : "var(--text-secondary)",
                border: periodoKey === p.val ? "none" : "1px solid var(--border)",
              }}
            >
              {p.label}
            </Link>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="stat-card">
              <p className="stat-label">{s.label}</p>
              <p className="stat-value" style={{ fontSize: "1.25rem" }}>{s.value}</p>
              <p className="stat-delta stat-delta-up" style={{ marginTop: "0.25rem" }}>{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top serviços */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <h3>Serviços mais agendados</h3>
            </div>
            {topServicos.length === 0 ? (
              <div className="empty-state" style={{ padding: "2rem" }}>
                <p className="empty-state-desc">Sem dados no período</p>
              </div>
            ) : (
              <div>
                {topServicos.map((s, i) => {
                  const maxCount = topServicos[0].count;
                  const pct = Math.round((s.count / maxCount) * 100);
                  return (
                    <div
                      key={s.nome}
                      className="px-5 py-3.5"
                      style={{ borderBottom: i < topServicos.length - 1 ? "1px solid var(--border)" : "none" }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{s.nome}</span>
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>{s.count} agendamentos</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: "var(--brand-500)", transition: "width 0.4s" }}
                        />
                      </div>
                      {s.receita > 0 && (
                        <p className="text-xs mt-1" style={{ color: "var(--brand-600)" }}>
                          R$ {s.receita.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} em receita
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Por profissional */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <h3>Desempenho por profissional</h3>
            </div>
            {porProfissional.length === 0 ? (
              <div className="empty-state" style={{ padding: "2rem" }}>
                <p className="empty-state-desc">Sem dados no período</p>
              </div>
            ) : (
              <div>
                {porProfissional.map((p, i) => {
                  const taxa = p.count > 0 ? Math.round((p.concluidos / p.count) * 100) : 0;
                  return (
                    <div
                      key={p.nome}
                      className="flex items-center gap-4 px-5 py-3.5"
                      style={{ borderBottom: i < porProfissional.length - 1 ? "1px solid var(--border)" : "none" }}
                    >
                      <div className="avatar avatar-md avatar-green flex-shrink-0">
                        {p.nome.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{p.nome}</p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {p.count} agendamentos · {p.concluidos} concluídos
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p
                          className="text-sm font-semibold"
                          style={{ color: taxa >= 70 ? "var(--success)" : taxa >= 40 ? "var(--brand-600)" : "var(--danger)" }}
                        >
                          {taxa}%
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>conclusão</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Resumo financeiro */}
        <div className="card p-5">
          <h3 className="mb-4">Resumo financeiro — {label}</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Receita total", value: `R$ ${receita.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, color: "var(--success)" },
              { label: "Despesas",      value: `R$ ${despesas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, color: "var(--danger)" },
              { label: "Lucro líquido", value: `R$ ${lucro.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,   color: lucro >= 0 ? "var(--brand-600)" : "var(--danger)" },
            ].map((item) => (
              <div key={item.label} className="text-center p-4 rounded-xl" style={{ background: "var(--surface-raised)" }}>
                <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{item.label}</p>
                <p className="font-bold text-lg" style={{ color: item.color }}>{item.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <Link href={`/financeiro`} className="btn btn-secondary" style={{ fontSize: "0.8125rem" }}>
              Ver lançamentos detalhados →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
