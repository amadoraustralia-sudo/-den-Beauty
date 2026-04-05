import FormCard from "@/components/FormCard";
import { createClient } from "@/lib/supabase/server";
import { criarAgendamento } from "./actions";

export default async function NovoAgendamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const [
    { data: clientes },
    { data: servicos },
    { data: profissionais },
  ] = await Promise.all([
    supabase.from("clientes").select("id, nome").order("nome"),
    supabase.from("servicos").select("id, nome, preco, duracao_min").eq("ativo", true).order("nome"),
    supabase.from("profissionais").select("id, nome").eq("ativo", true).order("nome"),
  ]);

  const hoje = new Date().toISOString().split("T")[0];

  return (
    <FormCard title="Novo agendamento" subtitle="Registre um agendamento para o salão" backHref="/agendamentos">
      <form action={criarAgendamento} className="space-y-5">
        {/* Cliente */}
        <div>
          <h4 className="mb-3" style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Cliente e serviço
          </h4>
          <div className="space-y-4">
            <div>
              <label className="label">Cliente <span style={{ color: "var(--danger)" }}>*</span></label>
              <select name="cliente_id" required className="input select" defaultValue={params.cliente ?? ""}>
                <option value="">Selecione o cliente...</option>
                {clientes?.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
              {(!clientes || clientes.length === 0) && (
                <p className="text-xs mt-1.5 flex items-center gap-1.5" style={{ color: "var(--warning)" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <a href="/clientes/novo" style={{ color: "var(--brand-600)" }}>Cadastre um cliente primeiro.</a>
                </p>
              )}
            </div>

            <div>
              <label className="label">Serviço <span style={{ color: "var(--danger)" }}>*</span></label>
              <select name="servico_id" required className="input select">
                <option value="">Selecione o serviço...</option>
                {servicos?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome} — {s.duracao_min}min · R$ {Number(s.preco).toFixed(2).replace(".", ",")}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Profissional</label>
              <select name="profissional_id" className="input select">
                <option value="">Sem preferência</option>
                {profissionais?.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <hr className="divider" />

        {/* Data e hora */}
        <div>
          <h4 className="mb-3" style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Data e horário
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Data <span style={{ color: "var(--danger)" }}>*</span></label>
              <input name="data" type="date" required defaultValue={hoje} className="input" />
            </div>
            <div>
              <label className="label">Horário <span style={{ color: "var(--danger)" }}>*</span></label>
              <input name="hora" type="time" required defaultValue="09:00" className="input" />
            </div>
          </div>
        </div>

        <hr className="divider" />

        {/* Valor e status */}
        <div>
          <h4 className="mb-3" style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Pagamento e status
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Valor cobrado (R$)</label>
              <input name="valor" type="number" min="0" step="0.01" placeholder="Deixe em branco para usar o preço do serviço" className="input" />
            </div>
            <div>
              <label className="label">Status</label>
              <select name="status" className="input select">
                <option value="aguardando">Aguardando confirmação</option>
                <option value="confirmado">Confirmado</option>
                <option value="concluido">Concluído</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>
        </div>

        <hr className="divider" />

        <div className="flex gap-3 justify-end">
          <a href="/agendamentos" className="btn btn-secondary">Cancelar</a>
          <button type="submit" className="btn btn-primary">Salvar agendamento</button>
        </div>
      </form>
    </FormCard>
  );
}
