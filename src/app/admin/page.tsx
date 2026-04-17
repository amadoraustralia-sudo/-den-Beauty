import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const metadata = { title: "Super Admin — Visão Geral" };

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [
    { count: totalSaloes },
    { count: totalClientes },
    { count: totalAgendamentos },
    { data: saloes },
    { data: transacoes },
  ] = await Promise.all([
    supabase.from("configuracoes").select("*", { count: "exact", head: true }),
    supabase.from("clientes").select("*", { count: "exact", head: true }),
    supabase.from("agendamentos").select("*", { count: "exact", head: true }),
    supabase.from("configuracoes")
      .select("id, nome_estabelecimento, slug, created_at, owner_user_id")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("transacoes").select("tipo, valor").eq("tipo", "entrada"),
  ]);

  const receitaTotal = transacoes?.reduce((acc, t) => acc + Number(t.valor), 0) ?? 0;

  const stats = [
    { label: "Salões ativos", value: String(totalSaloes ?? 0), href: "/admin/saloes", color: "var(--brand-400)" },
    { label: "Clientes cadastrados", value: String(totalClientes ?? 0), href: "/admin/saloes", color: "#60a5fa" },
    { label: "Agendamentos totais", value: String(totalAgendamentos ?? 0), href: "/admin/saloes", color: "#a78bfa" },
    { label: "Receita total registrada", value: `R$ ${receitaTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, href: "/admin/saloes", color: "#34d399" },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Visão Geral da Plataforma</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}
            className="rounded-xl p-5 block"
            style={{ background: "white", border: "1px solid var(--border)", textDecoration: "none" }}>
            <p className="text-xs font-medium mb-3" style={{ color: "var(--text-muted)" }}>{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </Link>
        ))}
      </div>

      {/* Últimos salões */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "white" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>Últimos salões cadastrados</h2>
          <Link href="/admin/saloes" className="text-xs font-medium" style={{ color: "var(--brand-600)" }}>
            Ver todos →
          </Link>
        </div>

        {!saloes || saloes.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Nenhum salão cadastrado ainda.</p>
          </div>
        ) : (
          <div>
            {saloes.map((s, i) => (
              <Link key={s.id} href={`/admin/saloes/${s.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                style={{ borderBottom: i < saloes.length - 1 ? "1px solid var(--border)" : "none", textDecoration: "none" }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm"
                    style={{ background: "var(--brand-100)", color: "var(--brand-700)" }}>
                    {s.nome_estabelecimento?.slice(0, 2).toUpperCase() ?? "??"}
                  </div>
                  <div>
                    <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>{s.nome_estabelecimento}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>/{s.slug}</p>
                  </div>
                </div>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {new Date(s.created_at).toLocaleDateString("pt-BR")}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
