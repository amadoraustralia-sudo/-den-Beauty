import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const metadata = { title: "Super Admin — Salões" };

export default async function AdminSaloesPage() {
  const supabase = await createClient();

  const { data: saloes } = await supabase
    .from("configuracoes")
    .select("id, nome_estabelecimento, slug, telefone, email, created_at, owner_user_id")
    .order("created_at", { ascending: false });

  // Para cada salão, busca contagem de clientes e agendamentos
  const saloesComStats = await Promise.all(
    (saloes ?? []).map(async (s) => {
      const [{ count: clientes }, { count: agendamentos }] = await Promise.all([
        supabase.from("clientes").select("*", { count: "exact", head: true }).eq("salao_id", s.id),
        supabase.from("agendamentos").select("*", { count: "exact", head: true }).eq("salao_id", s.id),
      ]);
      return { ...s, clientes: clientes ?? 0, agendamentos: agendamentos ?? 0 };
    })
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Todos os Salões</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          {saloesComStats.length} {saloesComStats.length === 1 ? "salão cadastrado" : "salões cadastrados"}
        </p>
      </div>

      {saloesComStats.length === 0 ? (
        <div className="rounded-xl p-12 text-center" style={{ border: "1px solid var(--border)", background: "white" }}>
          <p className="text-lg mb-2" style={{ color: "var(--text-muted)" }}>Nenhum salão cadastrado ainda.</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Salões aparecem aqui quando gestoras se cadastram.</p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "white" }}>
          {saloesComStats.map((s, i) => (
            <Link key={s.id} href={`/admin/saloes/${s.id}`}
              className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
              style={{ borderBottom: i < saloesComStats.length - 1 ? "1px solid var(--border)" : "none", textDecoration: "none" }}>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold"
                  style={{ background: "var(--brand-100)", color: "var(--brand-700)", fontSize: "0.875rem" }}>
                  {s.nome_estabelecimento?.slice(0, 2).toUpperCase() ?? "??"}
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                    {s.nome_estabelecimento}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    /{s.slug} · {s.telefone ?? s.email ?? "sem contato"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-center hidden sm:block">
                  <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{s.clientes}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>clientes</p>
                </div>
                <div className="text-center hidden sm:block">
                  <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{s.agendamentos}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>agendamentos</p>
                </div>
                <div className="text-right">
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {new Date(s.created_at).toLocaleDateString("pt-BR")}
                  </p>
                  <span className="badge badge-green text-xs">Ativo</span>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
