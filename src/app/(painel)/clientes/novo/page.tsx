import FormCard from "@/components/FormCard";
import { createClient } from "@/lib/supabase/server";
import { criarCliente } from "./actions";

function erroStyle(erros: string[], campo: string) {
  return erros.includes(campo) ? { borderColor: "var(--danger)", boxShadow: "0 0 0 2px rgb(239 68 68 / 0.15)" } : {};
}

export default async function NovoClientePage({
  searchParams,
}: {
  searchParams: Promise<{ erros?: string; erro?: string; msg?: string }>;
}) {
  const { erros: errosStr, erro, msg } = await searchParams;
  const erros = errosStr ? errosStr.split(",") : [];

  const supabase = await createClient();
  const { data: profissionais } = await supabase
    .from("profissionais").select("id, nome").eq("ativo", true).order("nome");

  return (
    <FormCard title="Novo cliente" subtitle="Preencha os dados do cliente" backHref="/clientes">
      {erros.length > 0 && (
        <div className="mb-4 rounded-xl p-3.5 flex gap-2.5" style={{ background: "#fff5f5", border: "1px solid #fecaca" }}>
          <svg className="flex-shrink-0 mt-0.5" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <p className="text-sm" style={{ color: "#b91c1c" }}>Preencha os campos obrigatórios.</p>
        </div>
      )}
      {erro === "db" && (
        <div className="mb-4 rounded-xl p-3.5" style={{ background: "#fff5f5", border: "1px solid #fecaca" }}>
          <p className="text-sm" style={{ color: "#b91c1c" }}>Erro ao salvar: {msg ?? "tente novamente."}</p>
        </div>
      )}

      <form action={criarCliente} className="space-y-5">
        <div>
          <h4 className="mb-3" style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Dados básicos
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Nome completo <span style={{ color: "var(--danger)" }}>*</span></label>
              <input name="nome" placeholder="Ex: Ana Lima" className="input" style={erroStyle(erros, "nome")} />
              {erros.includes("nome") && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>Campo obrigatório</p>}
            </div>
            <div>
              <label className="label">WhatsApp</label>
              <input name="telefone" placeholder="(11) 99999-9999" className="input" />
            </div>
            <div>
              <label className="label">E-mail</label>
              <input name="email" type="email" placeholder="cliente@email.com" className="input" />
            </div>
            <div>
              <label className="label">Data de nascimento</label>
              <input name="data_nascimento" type="date" className="input" />
            </div>
            <div>
              <label className="label">Profissional preferido</label>
              <select name="profissional_preferido_id" className="input select">
                <option value="">Sem preferência</option>
                {profissionais?.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
          </div>
        </div>

        <hr className="divider" />

        <div>
          <h4 className="mb-3" style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Observações e preferências
          </h4>
          <div className="space-y-4">
            <div>
              <label className="label">
                <span className="flex items-center gap-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  Alergias / Contraindicações
                </span>
              </label>
              <textarea name="alergias" rows={2} placeholder="Ex: alergia a amônia..." className="input" style={{ resize: "vertical" }} />
            </div>
            <div>
              <label className="label">Preferências</label>
              <textarea name="preferencias" rows={2} placeholder="Ex: máquina 2 nas laterais..." className="input" style={{ resize: "vertical" }} />
            </div>
          </div>
        </div>

        <hr className="divider" />

        <div className="flex gap-3 justify-end">
          <a href="/clientes" className="btn btn-secondary">Cancelar</a>
          <button type="submit" className="btn btn-primary">Salvar cliente</button>
        </div>
      </form>
    </FormCard>
  );
}
