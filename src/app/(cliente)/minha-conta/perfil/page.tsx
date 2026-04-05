import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { atualizarPerfil } from "./actions";

export default async function PerfilPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: cliente } = await supabase
    .from("clientes")
    .select("*")
    .eq("email", user.email!)
    .single();

  return (
    <div className="space-y-6">
      <div>
        <h1 style={{ fontSize: "1.375rem" }}>Meu perfil</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Mantenha seus dados atualizados.
        </p>
      </div>

      {saved === "1" && (
        <div
          className="rounded-xl p-4 flex gap-3 items-center"
          style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <p className="text-sm font-medium" style={{ color: "#15803d" }}>
            Perfil atualizado com sucesso!
          </p>
        </div>
      )}

      <form action={atualizarPerfil} className="space-y-4">
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Dados pessoais
          </h2>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
              Nome completo
            </label>
            <input
              type="text"
              name="nome"
              defaultValue={cliente?.nome ?? ""}
              className="input"
              placeholder="Seu nome"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
              Telefone
            </label>
            <input
              type="tel"
              name="telefone"
              defaultValue={cliente?.telefone ?? ""}
              className="input"
              placeholder="(00) 00000-0000"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
              E-mail
            </label>
            <input
              type="email"
              name="email"
              value={user.email ?? ""}
              className="input"
              style={{ opacity: 0.6, cursor: "not-allowed" }}
              disabled
              readOnly
            />
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              O e-mail não pode ser alterado aqui.
            </p>
          </div>
        </div>

        <button type="submit" className="btn btn-primary w-full" style={{ padding: "0.75rem" }}>
          Salvar alterações
        </button>
      </form>

      {/* Informações da conta */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
          Informações da conta
        </h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--text-muted)" }}>Membro desde</span>
            <span style={{ color: "var(--text-primary)" }}>
              {cliente?.created_at
                ? new Date(cliente.created_at).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
                : "—"}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--text-muted)" }}>Total de visitas</span>
            <span style={{ color: "var(--text-primary)" }}>{cliente?.total_visitas ?? 0}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--text-muted)" }}>Total investido</span>
            <span style={{ color: "var(--brand-600)", fontWeight: 600 }}>
              R$ {Number(cliente?.total_gasto ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
