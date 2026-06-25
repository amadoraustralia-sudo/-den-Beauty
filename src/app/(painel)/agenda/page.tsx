import { createClient } from "@/lib/supabase/server";
import { getSalaoId } from "@/lib/supabase/salon";
import Topbar from "@/components/Topbar";
import AgendaView from "@/components/AgendaView";
import Link from "next/link";

interface SearchParams { data?: string }

function getMondayOfWeek(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  const day = d.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMon);
  return d.toISOString().split("T")[0];
}

export default async function AgendaPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const [{ data: { user } }, salao_id] = await Promise.all([
    supabase.auth.getUser(),
    getSalaoId(),
  ]);
  const hoje = params.data ?? new Date().toISOString().split("T")[0];

  const monday = getMondayOfWeek(hoje);
  const sunday = new Date(monday + "T12:00:00");
  sunday.setDate(sunday.getDate() + 6);
  const sundayStr = sunday.toISOString().split("T")[0];

  const prev = new Date(hoje + "T12:00:00"); prev.setDate(prev.getDate() - 1);
  const next = new Date(hoje + "T12:00:00"); next.setDate(next.getDate() + 1);
  const prevWeek = new Date(monday + "T12:00:00"); prevWeek.setDate(prevWeek.getDate() - 7);
  const nextWeek = new Date(monday + "T12:00:00"); nextWeek.setDate(nextWeek.getDate() + 7);

  const [
    { data: agendamentos },
    { data: profissionais },
    { data: config },
    { data: bloqueios },
  ] = await Promise.all([
    supabase
      .from("agendamentos")
      .select("*, clientes(nome), servicos(nome, duracao_min), profissionais(nome), servicos_adicionais")
      .gte("data", monday)
      .lte("data", sundayStr)
      .order("hora"),
    supabase
      .from("profissionais")
      .select("id, nome")
      .eq("salao_id", salao_id ?? "")
      .eq("ativo", true)
      .order("nome"),
    supabase
      .from("configuracoes")
      .select("horarios_semana, horario_abertura, horario_fechamento, intervalo_agendamento")
      .eq("owner_user_id", user?.id ?? "")
      .maybeSingle(),
    supabase
      .from("horarios_bloqueados")
      .select("id, profissional_id, data, hora_inicio, hora_fim, motivo")
      .gte("data", monday)
      .lte("data", sundayStr),
  ]);

  const fmtData = new Date(hoje + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long",
  });

  const agendamentosHoje = (agendamentos ?? []).filter((a) => a.data === hoje);

  return (
    <>
      <Topbar
        title="Agenda"
        subtitle={`${agendamentosHoje.length} agendamentos · ${fmtData}`}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href={`/agenda?data=${prev.toISOString().split("T")[0]}`}
              className="btn btn-secondary"
              style={{ padding: "0.375rem 0.625rem" }}
              id="nav-prev-dia"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            </Link>
            <span className="text-sm font-medium" style={{ color: "var(--text-primary)", minWidth: 100, textAlign: "center" }}>
              {new Date(hoje + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
            </span>
            <Link
              href={`/agenda?data=${next.toISOString().split("T")[0]}`}
              className="btn btn-secondary"
              style={{ padding: "0.375rem 0.625rem" }}
              id="nav-next-dia"
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

      <div className="p-2 lg:p-6">
        <div className="card overflow-hidden">
          <AgendaView
            agendamentos={agendamentos ?? []}
            profissionais={profissionais ?? []}
            dataAtual={hoje}
            mondayStr={monday}
            prevWeekDate={prevWeek.toISOString().split("T")[0]}
            nextWeekDate={nextWeek.toISOString().split("T")[0]}
            prevDayDate={prev.toISOString().split("T")[0]}
            nextDayDate={next.toISOString().split("T")[0]}
            horariosSemana={(config as any)?.horarios_semana ?? null}
            horarioAbertura={config?.horario_abertura ?? null}
            horarioFechamento={config?.horario_fechamento ?? null}
            intervaloAgendamento={config?.intervalo_agendamento ?? 30}
            bloqueios={bloqueios ?? []}
          />
        </div>
      </div>
    </>
  );
}
