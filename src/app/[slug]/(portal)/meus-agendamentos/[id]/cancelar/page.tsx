import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { cancelarAgendamento } from "./actions";

export default async function CancelarPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const supabase = await createClient();

  const { data: configRows } = await supabase.rpc("get_configuracoes_portal", { p_slug: slug });
  const config = (configRows as any[])?.[0] ?? null;
  if (!config) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${slug}/login`);

  const { data: cliente } = await supabase
    .from("clientes").select("id")
    .eq("auth_user_id", user.id).eq("salao_id", config.id).maybeSingle();

  const { data: agendamento } = await supabase
    .from("agendamentos")
    .select("*, servicos(nome, duracao_min), profissionais(nome)")
    .eq("id", id)
    .eq("cliente_id", cliente?.id ?? "00000000-0000-0000-0000-000000000000")
    .eq("salao_id", config.id)
    .single();

  if (!agendamento) redirect(`/${slug}/meus-agendamentos`);
  if (agendamento.status === "cancelado" || agendamento.status === "concluido") {
    redirect(`/${slug}/meus-agendamentos`);
  }

  const dataFmt = new Date(agendamento.data + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long",
  });

  return (
    <div className="p-4 lg:p-8 max-w-lg mx-auto space-y-6">
      <div>
        <Link href={`/${slug}/meus-agendamentos`}
          className="inline-flex items-center gap-1.5 text-sm mb-4"
          style={{ color: "var(--text-muted)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          Voltar
        </Link>
        <h1 style={{ fontSize: "1.375rem" }}>Cancelar agendamento</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Confirme o cancelamento do serviço abaixo.
        </p>
      </div>

      <div className="card p-5">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 rounded-xl flex flex-col items-center justify-center"
            style={{ width: 52, height: 52, background: "var(--brand-50)", border: "1px solid var(--brand-100)" }}>
            <span className="text-base font-bold leading-none" style={{ color: "var(--brand-700)" }}>
              {new Date(agendamento.data + "T12:00:00").getDate()}
            </span>
            <span style={{ fontSize: "0.5625rem", color: "var(--brand-500)", textTransform: "uppercase" }}>
              {new Date(agendamento.data + "T12:00:00").toLocaleDateString("pt-BR", { month: "short" })}
            </span>
          </div>
          <div>
            <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
              {agendamento.servicos?.nome ?? "Serviço"}
            </p>
            <p className="text-sm mt-0.5 capitalize" style={{ color: "var(--text-muted)" }}>{dataFmt}</p>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
              {agendamento.hora?.slice(0, 5)} · {agendamento.profissionais?.nome ?? "Qualquer profissional"}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl p-4 flex gap-3"
        style={{ background: "#fff5f5", border: "1px solid #fecaca" }}>
        <svg className="flex-shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p className="text-sm" style={{ color: "#b91c1c" }}>
          Esta ação não pode ser desfeita. O horário ficará disponível para outros clientes.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <form action={cancelarAgendamento}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="slug" value={slug} />
          <button type="submit" className="btn w-full"
            style={{ background: "#ef4444", color: "white", border: "none", padding: "0.75rem" }}>
            Confirmar cancelamento
          </button>
        </form>
        <Link href={`/${slug}/meus-agendamentos`} className="btn w-full text-center" style={{ padding: "0.75rem" }}>
          Manter agendamento
        </Link>
      </div>
    </div>
  );
}
