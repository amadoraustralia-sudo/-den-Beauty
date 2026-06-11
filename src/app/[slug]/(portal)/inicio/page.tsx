import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

const statusBadge: Record<string, { cls: string; label: string }> = {
  confirmado: { cls: "badge badge-green",  label: "Confirmado" },
  aguardando:  { cls: "badge badge-yellow", label: "Aguardando" },
  cancelado:   { cls: "badge badge-red",    label: "Cancelado"  },
  concluido:   { cls: "badge badge-blue",   label: "Concluído"  },
};

export default async function InicioPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ toast?: string }>;
}) {
  const { slug } = await params;
  const { toast } = await searchParams;
  const supabase = await createClient();

  const { data: config } = await supabase
    .from("configuracoes").select("id").eq("slug", slug).single();
  if (!config) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Busca cliente
  let cliente = null;
  const { data: c1 } = await supabase
    .from("clientes").select("*").eq("auth_user_id", user.id).eq("salao_id", config.id).maybeSingle();
  if (c1) {
    cliente = c1;
  } else if (user.email) {
    const { data: c2 } = await supabase
      .from("clientes").select("*").eq("email", user.email).eq("salao_id", config.id).maybeSingle();
    cliente = c2;
    if (c2 && !c2.auth_user_id) {
      await supabase.from("clientes").update({ auth_user_id: user.id }).eq("id", c2.id);
    }
  }

  const hoje = new Date().toISOString().split("T")[0];

  const [{ data: proximos }, { data: servicos }] = await Promise.all([
    supabase
      .from("agendamentos")
      .select("*, servicos(nome, duracao_min, preco), profissionais(nome)")
      .eq("cliente_id", cliente?.id ?? "00000000-0000-0000-0000-000000000000")
      .eq("salao_id", config.id)
      .gte("data", hoje)
      .not("status", "eq", "cancelado")
      .order("data").order("hora")
      .limit(1),
    supabase
      .from("servicos")
      .select("id, nome, categoria, duracao_min, preco")
      .eq("salao_id", config.id).eq("ativo", true).gt("preco", 0)
      .order("nome").limit(6),
  ]);

  const primeiroNome = (cliente?.nome ?? user.email?.split("@")[0] ?? "").split(" ")[0];
  const proximoAg = proximos?.[0] ?? null;

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto lg:max-w-none">
      {toast === "bemvindo" && (
        <div className="mb-6 rounded-xl p-4 flex items-center gap-3" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          <p className="text-sm font-medium" style={{ color: "#15803d" }}>
            Bem-vindo(a)! Sua conta foi criada com sucesso. ✨
          </p>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Olá, {primeiroNome}! 👋
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Bem-vindo(a) ao seu espaço. Cuide-se com quem entende de beleza.
        </p>
      </div>

      {cliente && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-xl p-4" style={{ background: "white", border: "1px solid var(--border)" }}>
            <p className="text-2xl font-bold" style={{ color: "var(--brand-700)" }}>{cliente.total_visitas ?? 0}</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>visitas realizadas</p>
          </div>
          <div className="rounded-xl p-4" style={{ background: "white", border: "1px solid var(--border)" }}>
            <p className="text-2xl font-bold" style={{ color: "var(--brand-700)" }}>
              R$ {Number(cliente.total_gasto ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>investidos em você</p>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Próximo agendamento
        </h2>

        {!proximoAg ? (
          <div className="rounded-xl p-6 text-center" style={{ background: "white", border: "2px dashed var(--border)" }}>
            <div className="text-3xl mb-3">📅</div>
            <p className="font-medium mb-1" style={{ color: "var(--text-primary)" }}>Nenhum agendamento marcado</p>
            <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>Que tal se cuidar hoje?</p>
            <Link href={`/${slug}/novo`} className="btn btn-primary"
              style={{ fontSize: "0.8125rem", backgroundColor: "var(--brand-800)", borderColor: "var(--brand-800)" }}>
              Agendar agora
            </Link>
          </div>
        ) : (
          <div className="rounded-xl p-4" style={{ background: "white", border: "1px solid var(--border)" }}>
            <div className="flex items-start gap-4">
              <div className="rounded-xl flex flex-col items-center justify-center flex-shrink-0"
                style={{ width: 52, height: 52, background: "var(--brand-50)", border: "1px solid var(--brand-100)" }}>
                <span className="text-base font-bold leading-none" style={{ color: "var(--brand-700)" }}>
                  {new Date(proximoAg.data + "T12:00:00").getDate()}
                </span>
                <span style={{ fontSize: "0.5625rem", color: "var(--brand-500)", textTransform: "uppercase" }}>
                  {new Date(proximoAg.data + "T12:00:00").toLocaleDateString("pt-BR", { month: "short" })}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                  {proximoAg.servicos?.nome ?? "Serviço"}
                </p>
                <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {proximoAg.hora?.slice(0, 5)} · {proximoAg.profissionais?.nome ?? "Qualquer profissional"}
                </p>
              </div>
              <span className={statusBadge[proximoAg.status]?.cls ?? "badge badge-gray"}>
                {statusBadge[proximoAg.status]?.label ?? proximoAg.status}
              </span>
            </div>
            {(proximoAg.status === "aguardando" || proximoAg.status === "confirmado") && (
              <div className="flex gap-2 mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                <Link href={`/${slug}/novo`} className="btn btn-secondary flex-1 text-center" style={{ fontSize: "0.8125rem" }}>
                  Reagendar
                </Link>
                <Link href={`/${slug}/meus-agendamentos/${proximoAg.id}/cancelar`}
                  className="btn btn-ghost flex-1 text-center"
                  style={{ fontSize: "0.8125rem", color: "var(--danger)" }}>
                  Cancelar
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {servicos && servicos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Serviços disponíveis
            </h2>
            <Link href={`/${slug}/novo`} className="text-xs font-medium" style={{ color: "var(--brand-600)" }}>
              Ver todos →
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
            {servicos.map((s) => (
              <Link key={s.id} href={`/${slug}/novo`}
                className="flex-shrink-0 rounded-xl p-4 w-44 transition-shadow hover:shadow-md"
                style={{ background: "white", border: "1px solid var(--border)", textDecoration: "none" }}>
                <p className="font-semibold text-sm mb-1 truncate" style={{ color: "var(--text-primary)" }}>{s.nome}</p>
                <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
                  {s.duracao_min < 60 ? `${s.duracao_min}min` : `${Math.floor(s.duracao_min / 60)}h${s.duracao_min % 60 > 0 ? s.duracao_min % 60 + "min" : ""}`}
                </p>
                <p className="font-bold text-sm" style={{ color: "var(--brand-600)" }}>
                  R$ {Number(s.preco).toFixed(2).replace(".", ",")}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <Link href={`/${slug}/novo`}
        className="lg:hidden fixed bottom-20 right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-xl z-30 transition-transform hover:scale-105"
        style={{ background: "var(--brand-800)" }} aria-label="Agendar">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </Link>
    </div>
  );
}
