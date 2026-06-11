import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

const statusBadge: Record<string, { cls: string; label: string }> = {
  confirmado: { cls: "badge badge-green",  label: "Confirmado" },
  aguardando:  { cls: "badge badge-yellow", label: "Aguardando" },
  cancelado:   { cls: "badge badge-red",    label: "Cancelado"  },
  concluido:   { cls: "badge badge-blue",   label: "Concluído"  },
};

interface Agendamento {
  id: string;
  data: string;
  hora: string;
  status: string;
  valor: number | null;
  servicos: { nome: string; duracao_min: number; preco: number } | null;
  profissionais: { nome: string } | null;
}

function AgCard({ a, slug, showCancel, showRepeat }: { a: Agendamento; slug: string; showCancel: boolean; showRepeat: boolean }) {
  const st = statusBadge[a.status] ?? { cls: "badge badge-gray", label: a.status };
  const preco = Number(a.valor ?? a.servicos?.preco ?? 0);

  return (
    <div className="rounded-xl p-4" style={{ background: "white", border: "1px solid var(--border)" }}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 rounded-xl flex flex-col items-center justify-center"
          style={{ width: 52, height: 52, background: "var(--brand-50)", border: "1px solid var(--brand-100)" }}>
          <span className="text-base font-bold leading-none" style={{ color: "var(--brand-700)" }}>
            {new Date(a.data + "T12:00:00").getDate()}
          </span>
          <span style={{ fontSize: "0.5625rem", color: "var(--brand-500)", textTransform: "uppercase" }}>
            {new Date(a.data + "T12:00:00").toLocaleDateString("pt-BR", { month: "short" })}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
              {a.servicos?.nome ?? "Serviço"}
            </p>
            <span className={st.cls}>{st.label}</span>
          </div>
          <p className="text-xs mt-0.5 capitalize" style={{ color: "var(--text-muted)" }}>
            {new Date(a.data + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {a.hora?.slice(0, 5)} · {a.profissionais?.nome ?? "Qualquer profissional"}
          </p>
          {preco > 0 && (
            <p className="text-xs mt-1 font-semibold" style={{ color: "var(--brand-600)" }}>
              R$ {preco.toFixed(2).replace(".", ",")}
            </p>
          )}
        </div>
      </div>

      {(showCancel || showRepeat) && (
        <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
          {showRepeat && (
            <Link href={`/${slug}/novo`} className="btn btn-secondary flex-1 text-center" style={{ fontSize: "0.8125rem" }}>
              Agendar novamente
            </Link>
          )}
          {showCancel && (
            <Link href={`/${slug}/meus-agendamentos/${a.id}/cancelar`}
              className="flex-1 text-center px-3 py-2 rounded-lg text-xs font-medium transition-colors"
              style={{ border: "1px solid var(--danger)", color: "var(--danger)", background: "var(--danger-bg)" }}>
              Cancelar
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default async function MeusAgendamentosPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ aba?: string }>;
}) {
  const { slug } = await params;
  const { aba = "proximos" } = await searchParams;
  const supabase = await createClient();

  const { data: config } = await supabase
    .from("configuracoes").select("id").eq("slug", slug).single();
  if (!config) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  let clienteId = "00000000-0000-0000-0000-000000000000";
  const { data: c1 } = await supabase.from("clientes").select("id")
    .eq("auth_user_id", user.id).eq("salao_id", config.id).maybeSingle();
  if (c1) { clienteId = c1.id; }
  else if (user.email) {
    const { data: c2 } = await supabase.from("clientes").select("id")
      .eq("email", user.email).eq("salao_id", config.id).maybeSingle();
    if (c2) clienteId = c2.id;
  }

  const { data: raw } = await supabase
    .from("agendamentos")
    .select("*, servicos(nome, duracao_min, preco), profissionais(nome)")
    .eq("cliente_id", clienteId)
    .eq("salao_id", config.id)
    .order("data", { ascending: false })
    .order("hora", { ascending: false });

  const agendamentos = (raw ?? []) as Agendamento[];
  const hoje = new Date().toISOString().split("T")[0];

  const proximos = agendamentos.filter(
    (a) => a.data >= hoje && a.status !== "cancelado" && a.status !== "concluido"
  );
  const historico = agendamentos.filter(
    (a) => a.data < hoje || a.status === "cancelado" || a.status === "concluido"
  );

  const abas = [
    { key: "proximos", label: `Próximos (${proximos.length})` },
    { key: "historico", label: `Histórico (${historico.length})` },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Meus agendamentos</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Acompanhe seus serviços marcados e histórico.</p>
      </div>

      <div className="flex rounded-xl p-1 mb-6" style={{ background: "white", border: "1px solid var(--border)" }}>
        {abas.map((t) => (
          <Link key={t.key} href={`/${slug}/meus-agendamentos?aba=${t.key}`}
            className="flex-1 text-center py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: aba === t.key ? "var(--brand-800)" : "transparent",
              color: aba === t.key ? "white" : "var(--text-muted)",
              textDecoration: "none",
            }}>
            {t.label}
          </Link>
        ))}
      </div>

      {aba === "proximos" && (
        proximos.length === 0 ? (
          <div className="rounded-xl p-8 text-center" style={{ background: "white", border: "2px dashed var(--border)" }}>
            <div className="text-3xl mb-3">📅</div>
            <p className="font-medium mb-1" style={{ color: "var(--text-primary)" }}>Nenhum agendamento próximo</p>
            <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>Que tal marcar um horário agora?</p>
            <Link href={`/${slug}/novo`} className="btn btn-primary"
              style={{ fontSize: "0.8125rem", backgroundColor: "var(--brand-800)", borderColor: "var(--brand-800)" }}>
              Agendar agora
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {proximos.map((a) => (
              <AgCard key={a.id} a={a} slug={slug}
                showCancel={a.status === "aguardando" || a.status === "confirmado"}
                showRepeat={false} />
            ))}
          </div>
        )
      )}

      {aba === "historico" && (
        historico.length === 0 ? (
          <div className="rounded-xl p-8 text-center" style={{ background: "white", border: "1px solid var(--border)" }}>
            <p className="font-medium mb-1" style={{ color: "var(--text-primary)" }}>Nenhum histórico ainda</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Seu histórico de visitas aparecerá aqui.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {historico.map((a) => (
              <AgCard key={a.id} a={a} slug={slug}
                showCancel={false}
                showRepeat={a.status === "concluido"} />
            ))}
          </div>
        )
      )}
    </div>
  );
}
