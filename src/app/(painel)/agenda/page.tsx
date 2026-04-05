import { createClient } from "@/lib/supabase/server";
import Topbar from "@/components/Topbar";
import AgendaView from "@/components/AgendaView";
import Link from "next/link";

interface SearchParams { data?: string }

export default async function AgendaPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const hoje = params.data ?? new Date().toISOString().split("T")[0];

  const prev = new Date(hoje + "T12:00:00"); prev.setDate(prev.getDate() - 1);
  const next = new Date(hoje + "T12:00:00"); next.setDate(next.getDate() + 1);
  const prevStr = prev.toISOString().split("T")[0];
  const nextStr = next.toISOString().split("T")[0];

  const [{ data: agendamentos }, { data: profissionais }] = await Promise.all([
    supabase
      .from("agendamentos")
      .select("*, clientes(nome), servicos(nome, duracao_min), profissionais(nome)")
      .eq("data", hoje)
      .order("hora"),
    supabase
      .from("profissionais")
      .select("id, nome")
      .eq("ativo", true)
      .order("nome"),
  ]);

  const fmtData = new Date(hoje + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long",
  });

  return (
    <>
      <Topbar
        title="Agenda"
        subtitle={`${agendamentos?.length ?? 0} agendamentos · ${fmtData}`}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href={`/agenda?data=${prevStr}`}
              className="btn btn-secondary"
              style={{ padding: "0.375rem 0.625rem" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            </Link>
            <span className="text-sm font-medium capitalize" style={{ color: "var(--text-primary)", minWidth: 120, textAlign: "center" }}>
              {new Date(hoje + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
            </span>
            <Link
              href={`/agenda?data=${nextStr}`}
              className="btn btn-secondary"
              style={{ padding: "0.375rem 0.625rem" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </Link>
            <Link
              href="/agenda"
              className="btn btn-secondary"
              style={{ fontSize: "0.8125rem", padding: "0.375rem 0.75rem" }}
            >
              Hoje
            </Link>
          </div>
        }
      />

      <div className="p-6">
        <div className="card overflow-hidden">
          <AgendaView
            agendamentos={agendamentos ?? []}
            profissionais={profissionais ?? []}
            dataAtual={hoje}
          />
        </div>
      </div>
    </>
  );
}
