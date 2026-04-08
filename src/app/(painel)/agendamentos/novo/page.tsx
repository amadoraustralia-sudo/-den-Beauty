import FormCard from "@/components/FormCard";
import { createClient } from "@/lib/supabase/server";
import { criarAgendamento } from "./actions";

const FORMAS_PAGAMENTO = ["Pix", "Cartão de Crédito", "Cartão de Débito", "Dinheiro", "Outro"];

function erroStyle(erros: string[], campo: string) {
  return erros.includes(campo) ? { borderColor: "var(--danger)", boxShadow: "0 0 0 2px rgb(239 68 68 / 0.15)" } : {};
}

export default async function NovoAgendamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string; erros?: string; erro?: string; msg?: string }>;
}) {
  const { cliente: clienteParam, erros: errosStr, erro, msg } = await searchParams;
  const erros = errosStr ? errosStr.split(",") : [];

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
      {erros.length > 0 && (
        <div className="mb-4 rounded-xl p-3.5 flex gap-2.5" style={{ background: "#fff5f5", border: "1px solid #fecaca" }}>
          <svg className="flex-shrink-0 mt-0.5" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <p className="text-sm" style={{ color: "#b91c1c" }}>Preencha os campos obrigatórios destacados.</p>
        </div>
      )}
      {erro === "db" && (
        <div className="mb-4 rounded-xl p-3.5" style={{ background: "#fff5f5", border: "1px solid #fecaca" }}>
          <p className="text-sm" style={{ color: "#b91c1c" }}>Erro ao salvar: {msg ?? "tente novamente."}</p>
        </div>
      )}

      <form action={criarAgendamento} className="space-y-5">
        <div>
          <h4 className="mb-3" style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Cliente e serviço
          </h4>
          <div className="space-y-4">
            <div>
              <label className="label">Cliente <span style={{ color: "var(--danger)" }}>*</span></label>
              <select name="cliente_id" className="input select" defaultValue={clienteParam ?? ""} style={erroStyle(erros, "cliente_id")}>
                <option value="">Selecione o cliente...</option>
                {clientes?.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
              {erros.includes("cliente_id") && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>Selecione um cliente</p>}
              {(!clientes || clientes.length === 0) && (
                <p className="text-xs mt-1.5"><a href="/clientes/novo" style={{ color: "var(--brand-600)" }}>Cadastre um cliente primeiro.</a></p>
              )}
            </div>
            <div>
              <label className="label">Serviço <span style={{ color: "var(--danger)" }}>*</span></label>
              <select name="servico_id" className="input select" style={erroStyle(erros, "servico_id")}>
                <option value="">Selecione o serviço...</option>
                {servicos?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome} — {s.duracao_min}min · R$ {Number(s.preco).toFixed(2).replace(".", ",")}
                  </option>
                ))}
              </select>
              {erros.includes("servico_id") && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>Selecione um serviço</p>}
            </div>
            <div>
              <label className="label">Profissional</label>
              <select name="profissional_id" className="input select">
                <option value="">Sem preferência</option>
                {profissionais?.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
          </div>
        </div>

        <hr className="divider" />

        <div>
          <h4 className="mb-3" style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Data e horário
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Data <span style={{ color: "var(--danger)" }}>*</span></label>
              <input name="data" type="date" defaultValue={hoje} className="input" style={erroStyle(erros, "data")} />
              {erros.includes("data") && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>Campo obrigatório</p>}
            </div>
            <div>
              <label className="label">Horário <span style={{ color: "var(--danger)" }}>*</span></label>
              <input name="hora" type="time" defaultValue="09:00" className="input" style={erroStyle(erros, "hora")} />
              {erros.includes("hora") && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>Campo obrigatório</p>}
            </div>
          </div>
        </div>

        <hr className="divider" />

        <div>
          <h4 className="mb-3" style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Pagamento e status
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Valor cobrado (R$)</label>
              <input name="valor" type="number" min="0" step="0.01" placeholder="Preço do serviço" className="input" />
            </div>
            <div>
              <label className="label">Status</label>
              <select name="status" className="input select">
                <option value="aguardando">Aguardando</option>
                <option value="confirmado">Confirmado</option>
                <option value="concluido">Concluído</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Forma de pagamento</label>
              <select name="forma_pagamento" className="input select">
                <option value="">Não informado</option>
                {FORMAS_PAGAMENTO.map((f) => <option key={f} value={f}>{f}</option>)}
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
