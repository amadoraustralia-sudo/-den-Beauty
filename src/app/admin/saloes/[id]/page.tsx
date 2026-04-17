import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function AdminSalaoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: salao } = await supabase
    .from("configuracoes")
    .select("*")
    .eq("id", id)
    .single();

  if (!salao) notFound();

  const [
    { data: clientes },
    { data: profissionais },
    { data: servicos },
    { data: agendamentosRecentes },
    { data: transacoes },
  ] = await Promise.all([
    supabase.from("clientes").select("id, nome, email, created_at").eq("salao_id", id).order("created_at", { ascending: false }).limit(5),
    supabase.from("profissionais").select("id, nome, cargo, ativo").eq("salao_id", id).order("nome"),
    supabase.from("servicos").select("id, nome, categoria, preco, ativo").eq("salao_id", id).order("nome"),
    supabase.from("agendamentos").select("id, data, hora, status, clientes(nome), servicos(nome)").eq("salao_id", id).order("data", { ascending: false }).order("hora", { ascending: false }).limit(5),
    supabase.from("transacoes").select("tipo, valor").eq("salao_id", id).eq("tipo", "entrada"),
  ]);

  const receitaTotal = transacoes?.reduce((acc, t) => acc + Number(t.valor), 0) ?? 0;

  const statusBadge: Record<string, string> = {
    confirmado: "badge badge-green",
    aguardando: "badge badge-yellow",
    cancelado: "badge badge-red",
    concluido: "badge badge-blue",
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/saloes" className="flex items-center gap-1.5 text-sm mb-4" style={{ color: "var(--text-muted)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Todos os salões
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg"
            style={{ background: "var(--brand-100)", color: "var(--brand-700)" }}>
            {salao.nome_estabelecimento?.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{salao.nome_estabelecimento}</h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              /{salao.slug} · cadastrado em {new Date(salao.created_at).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Clientes", value: clientes?.length ?? 0 },
          { label: "Profissionais", value: profissionais?.length ?? 0 },
          { label: "Serviços", value: servicos?.length ?? 0 },
          { label: "Receita total", value: `R$ ${receitaTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-4" style={{ background: "white", border: "1px solid var(--border)" }}>
            <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>{s.label}</p>
            <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Configurações */}
      <div className="rounded-xl p-5 mb-6" style={{ background: "white", border: "1px solid var(--border)" }}>
        <h2 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Configurações do salão</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          {salao.telefone && <div><p className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>Telefone</p><p style={{ color: "var(--text-primary)" }}>{salao.telefone}</p></div>}
          {salao.email && <div><p className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>E-mail</p><p style={{ color: "var(--text-primary)" }}>{salao.email}</p></div>}
          {salao.endereco && <div><p className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>Endereço</p><p style={{ color: "var(--text-primary)" }}>{salao.endereco}</p></div>}
          <div><p className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>Horário</p><p style={{ color: "var(--text-primary)" }}>{salao.horario_abertura?.slice(0,5)} – {salao.horario_fechamento?.slice(0,5)}</p></div>
          <div><p className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>Intervalo de slots</p><p style={{ color: "var(--text-primary)" }}>{salao.intervalo_agendamento} min</p></div>
          <div><p className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>Link público</p><p style={{ color: "var(--brand-600)" }}>/{salao.slug}</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agendamentos recentes */}
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "white" }}>
          <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>Agendamentos recentes</h2>
          </div>
          {!agendamentosRecentes?.length ? (
            <p className="p-5 text-sm" style={{ color: "var(--text-muted)" }}>Nenhum agendamento ainda.</p>
          ) : (
            agendamentosRecentes.map((a, i) => (
              <div key={a.id} className="flex items-center justify-between px-5 py-3"
                style={{ borderBottom: i < agendamentosRecentes.length - 1 ? "1px solid var(--border)" : "none" }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {(a.clientes as { nome: string } | null)?.nome ?? "—"}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {(a.servicos as { nome: string } | null)?.nome ?? "—"} · {a.data} {a.hora?.slice(0, 5)}
                  </p>
                </div>
                <span className={statusBadge[a.status] ?? "badge badge-gray"}>{a.status}</span>
              </div>
            ))
          )}
        </div>

        {/* Profissionais */}
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "white" }}>
          <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>Profissionais</h2>
          </div>
          {!profissionais?.length ? (
            <p className="p-5 text-sm" style={{ color: "var(--text-muted)" }}>Nenhum profissional cadastrado.</p>
          ) : (
            profissionais.map((p, i) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3"
                style={{ borderBottom: i < profissionais.length - 1 ? "1px solid var(--border)" : "none" }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: "var(--brand-100)", color: "var(--brand-700)" }}>
                    {p.nome.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{p.nome}</p>
                    {p.cargo && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{p.cargo}</p>}
                  </div>
                </div>
                <span className={`badge ${p.ativo ? "badge-green" : "badge-gray"}`}>{p.ativo ? "Ativo" : "Inativo"}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
