import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

const statusBadge: Record<string, { cls: string; label: string }> = {
  confirmado: { cls: "badge badge-green", label: "Confirmado" },
  aguardando:  { cls: "badge badge-yellow", label: "Aguardando" },
  cancelado:   { cls: "badge badge-red", label: "Cancelado" },
  concluido:   { cls: "badge badge-blue", label: "Concluído" },
};

interface Agendamento {
  id: string;
  data: string;
  hora: string;
  status: string;
  preco?: number | null;
  cliente_id: string;
  servicos: { nome: string; duracao_min: number; preco: number } | null;
  profissionais: { nome: string } | null;
}

function AgendamentoCard({ a, showCancel }: { a: Agendamento; showCancel: boolean }) {
  const dataFmt = new Date(a.data + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const st = statusBadge[a.status] ?? { cls: "badge badge-gray", label: a.status };
  const preco = Number(a.preco ?? a.servicos?.preco ?? 0);

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className="flex-shrink-0 rounded-xl flex flex-col items-center justify-center"
            style={{ width: 48, height: 48, background: "var(--brand-50)", border: "1px solid var(--brand-100)" }}
          >
            <span className="text-sm font-bold leading-none" style={{ color: "var(--brand-700)" }}>
              {new Date(a.data + "T12:00:00").getDate()}
            </span>
            <span style={{ fontSize: "0.5625rem", color: "var(--brand-500)", textTransform: "uppercase" }}>
              {new Date(a.data + "T12:00:00").toLocaleDateString("pt-BR", { month: "short" })}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>
              {a.servicos?.nome ?? "Serviço"}
            </p>
            <p className="text-xs mt-0.5 capitalize" style={{ color: "var(--text-muted)" }}>
              {dataFmt}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {a.hora?.slice(0, 5)} · {a.profissionais?.nome ?? "Qualquer profissional"}
            </p>
            {preco > 0 && (
              <p className="text-xs mt-1 font-medium" style={{ color: "var(--brand-600)" }}>
                R$ {preco.toFixed(2).replace(".", ",")}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className={st.cls}>{st.label}</span>
          {showCancel && (
            <Link
              href={`/minha-conta/agendamentos/${a.id}/cancelar`}
              className="text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              Cancelar
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default async function AgendamentosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: cliente } = await supabase
    .from("clientes")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  const clienteId = cliente?.id ?? "00000000-0000-0000-0000-000000000000";

  const { data: raw } = await supabase
    .from("agendamentos")
    .select("*, servicos(nome, duracao_min, preco), profissionais(nome)")
    .eq("cliente_id", clienteId)
    .order("data", { ascending: false })
    .order("hora", { ascending: false });

  const agendamentos = (raw ?? []) as Agendamento[];
  const hoje = new Date().toISOString().split("T")[0];

  const proximos = agendamentos.filter(
    (a) => a.data >= hoje && a.status !== "cancelado"
  );
  const historico = agendamentos.filter(
    (a) => a.data < hoje || a.status === "cancelado" || a.status === "concluido"
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 style={{ fontSize: "1.375rem" }}>Meus agendamentos</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Histórico e próximos serviços.
        </p>
      </div>

      {/* Próximos */}
      <section>
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Próximos
        </h2>
        {proximos.length === 0 ? (
          <div className="card">
            <div className="empty-state" style={{ padding: "2.5rem 1.5rem" }}>
              <div className="empty-state-icon">📅</div>
              <p className="empty-state-title">Nenhum agendamento próximo</p>
              <p className="empty-state-desc">Que tal marcar um horário?</p>
              <Link href="/agendar" className="btn btn-primary" style={{ marginTop: "1rem", fontSize: "0.8125rem" }}>
                Agendar agora
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {proximos.map((a) => (
              <AgendamentoCard
                key={a.id}
                a={a}
                showCancel={a.status === "confirmado" || a.status === "aguardando"}
              />
            ))}
          </div>
        )}
      </section>

      {/* Histórico */}
      {historico.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Histórico
          </h2>
          <div className="space-y-3">
            {historico.map((a) => (
              <AgendamentoCard key={a.id} a={a} showCancel={false} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
