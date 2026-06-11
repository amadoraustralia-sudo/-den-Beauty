import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

const statusBadge: Record<string, { cls: string; label: string }> = {
  confirmado: { cls: "badge badge-green", label: "Confirmado" },
  aguardando:  { cls: "badge badge-yellow", label: "Aguardando" },
  cancelado:   { cls: "badge badge-red", label: "Cancelado" },
  concluido:   { cls: "badge badge-blue", label: "Concluído" },
};

export default async function MinhaContaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: cliente } = await supabase
    .from("clientes")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  // Próximos agendamentos
  const hoje = new Date().toISOString().split("T")[0];
  const { data: proximos } = await supabase
    .from("agendamentos")
    .select("*, servicos(nome, duracao_min, preco), profissionais(nome)")
    .eq("cliente_id", cliente?.id ?? "00000000-0000-0000-0000-000000000000")
    .gte("data", hoje)
    .not("status", "eq", "cancelado")
    .order("data")
    .order("hora")
    .limit(3);

  const primeiroNome = (cliente?.nome ?? user.email?.split("@")[0] ?? "").split(" ")[0];

  return (
    <div className="space-y-6">
      {/* Boas-vindas */}
      <div>
        <h1 style={{ fontSize: "1.375rem" }}>Olá, {primeiroNome} 👋</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Bem-vinda ao seu espaço. Acompanhe seus agendamentos e histórico.
        </p>
      </div>

      {/* CTA principal */}
      <Link
        href="/agendar"
        className="flex items-center justify-between p-5 rounded-xl transition-opacity hover:opacity-90"
        style={{ background: "var(--brand-800)", textDecoration: "none" }}
      >
        <div>
          <p className="font-semibold text-sm" style={{ color: "white" }}>Agendar um serviço</p>
          <p className="text-xs mt-0.5" style={{ color: "rgb(255 255 255 / 0.55)" }}>
            Escolha o serviço, profissional e horário
          </p>
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "var(--brand-400)" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
          </svg>
        </div>
      </Link>

      {/* Próximos agendamentos */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h3 style={{ fontSize: "0.9375rem" }}>Próximos agendamentos</h3>
          <Link href="/minha-conta/agendamentos" className="text-xs" style={{ color: "var(--brand-600)" }}>
            Ver todos
          </Link>
        </div>

        {!proximos || proximos.length === 0 ? (
          <div className="empty-state" style={{ padding: "2.5rem 1.5rem" }}>
            <div className="empty-state-icon">📅</div>
            <p className="empty-state-title">Nenhum agendamento próximo</p>
            <p className="empty-state-desc">Que tal agendar um serviço?</p>
            <Link href="/agendar" className="btn btn-primary" style={{ marginTop: "1rem", fontSize: "0.8125rem" }}>
              Agendar agora
            </Link>
          </div>
        ) : (
          <div>
            {proximos.map((a, i) => {
              const dataFmt = new Date(a.data + "T12:00:00").toLocaleDateString("pt-BR", {
                weekday: "short", day: "numeric", month: "short",
              });
              const st = statusBadge[a.status] ?? { cls: "badge badge-gray", label: a.status };
              return (
                <div
                  key={a.id}
                  className="px-5 py-4"
                  style={{ borderBottom: i < proximos.length - 1 ? "1px solid var(--border)" : "none" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className="flex-shrink-0 rounded-xl flex flex-col items-center justify-center"
                        style={{
                          width: 44, height: 44,
                          background: "var(--brand-50)",
                          border: "1px solid var(--brand-100)",
                        }}
                      >
                        <span className="text-xs font-bold leading-none" style={{ color: "var(--brand-700)" }}>
                          {new Date(a.data + "T12:00:00").getDate()}
                        </span>
                        <span style={{ fontSize: "0.5625rem", color: "var(--brand-500)", textTransform: "uppercase" }}>
                          {new Date(a.data + "T12:00:00").toLocaleDateString("pt-BR", { month: "short" })}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                          {a.servicos?.nome ?? "Serviço"}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {a.hora?.slice(0, 5)} · {a.profissionais?.nome ?? "Qualquer profissional"}
                        </p>
                        <p className="text-xs mt-0.5 capitalize" style={{ color: "var(--text-muted)" }}>
                          {dataFmt}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className={st.cls}>{st.label}</span>
                      {a.status === "confirmado" || a.status === "aguardando" ? (
                        <Link
                          href={`/minha-conta/agendamentos/${a.id}/cancelar`}
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Cancelar
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Informações rápidas */}
      {cliente && (
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: "var(--brand-600)" }}>
              {cliente.total_visitas ?? 0}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>visitas realizadas</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: "var(--brand-600)" }}>
              R$ {Number(cliente.total_gasto ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>investidos em você</p>
          </div>
        </div>
      )}
    </div>
  );
}
