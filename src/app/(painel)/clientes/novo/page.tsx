import FormCard from "@/components/FormCard";
import { createClient } from "@/lib/supabase/server";
import { criarCliente } from "./actions";

export default async function NovoClientePage() {
  const supabase = await createClient();
  const { data: profissionais } = await supabase
    .from("profissionais")
    .select("id, nome")
    .eq("ativo", true)
    .order("nome");

  return (
    <FormCard title="Novo cliente" subtitle="Preencha os dados do cliente" backHref="/clientes">
      <form action={criarCliente} className="space-y-5">
        {/* Dados básicos */}
        <div>
          <h4 className="mb-3" style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Dados básicos
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Nome completo <span style={{ color: "var(--danger)" }}>*</span></label>
              <input name="nome" required placeholder="Ex: Ana Lima" className="input" />
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
                {profissionais?.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <hr className="divider" />

        {/* Observações */}
        <div>
          <h4 className="mb-3" style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Observações e preferências
          </h4>
          <div className="space-y-4">
            <div>
              <label className="label">
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  Alergias / Contraindicações
                </span>
              </label>
              <textarea
                name="alergias"
                rows={2}
                placeholder="Ex: alergia a amônia, sensibilidade a produtos com sulfato..."
                className="input"
                style={{ resize: "vertical" }}
              />
            </div>
            <div>
              <label className="label">Preferências</label>
              <textarea
                name="preferencias"
                rows={2}
                placeholder="Ex: máquina 2 nas laterais, não gosta de secador, prefere franja longa..."
                className="input"
                style={{ resize: "vertical" }}
              />
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
