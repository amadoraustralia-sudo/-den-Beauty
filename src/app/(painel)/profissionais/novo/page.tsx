import FormCard from "@/components/FormCard";
import { criarProfissional } from "./actions";

const especialidades = ["Corte", "Barba", "Coloração", "Escova", "Progressiva", "Hidratação", "Manicure", "Pedicure", "Design de sobrancelha", "Limpeza de pele", "Maquiagem"];

function erroStyle(erros: string[], campo: string) {
  return erros.includes(campo) ? { borderColor: "var(--danger)", boxShadow: "0 0 0 2px rgb(239 68 68 / 0.15)" } : {};
}

export default async function NovoProfissionalPage({
  searchParams,
}: {
  searchParams: Promise<{ erros?: string; erro?: string; msg?: string }>;
}) {
  const { erros: errosStr, erro, msg } = await searchParams;
  const erros = errosStr ? errosStr.split(",") : [];

  return (
    <FormCard title="Novo profissional" subtitle="Cadastre um profissional do seu salão" backHref="/profissionais">
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

      <form action={criarProfissional} className="space-y-5">
        <div>
          <h4 className="mb-3" style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Dados pessoais
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Nome completo <span style={{ color: "var(--danger)" }}>*</span></label>
              <input name="nome" placeholder="Ex: Carla Santos" className="input" style={erroStyle(erros, "nome")} />
              {erros.includes("nome") && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>Campo obrigatório</p>}
            </div>
            <div>
              <label className="label">Cargo / Função</label>
              <input name="cargo" placeholder="Ex: Cabeleireira" className="input" />
            </div>
            <div>
              <label className="label">E-mail</label>
              <input name="email" type="email" placeholder="profissional@email.com" className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Telefone / WhatsApp</label>
              <input name="telefone" type="tel" placeholder="(11) 99999-9999" className="input" />
            </div>
          </div>
        </div>

        <hr className="divider" />

        <div>
          <h4 className="mb-3" style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Remuneração
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Comissão (%) <span style={{ color: "var(--danger)" }}>*</span></label>
              <input name="percentual_comissao" type="number" min="0" max="100" step="0.5" defaultValue="50" className="input" style={erroStyle(erros, "percentual_comissao")} />
              {erros.includes("percentual_comissao") && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>Valor entre 0 e 100</p>}
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>% sobre cada atendimento concluído</p>
            </div>
            <div>
              <label className="label">Período de fechamento</label>
              <select name="periodo_fechamento" className="input select">
                <option value="semanal">Semanal</option>
                <option value="quinzenal">Quinzenal</option>
                <option value="mensal" defaultValue="mensal">Mensal</option>
              </select>
            </div>
          </div>
        </div>

        <hr className="divider" />

        <div>
          <h4 className="mb-3" style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Especialidades
          </h4>
          <div className="flex flex-wrap gap-2">
            {especialidades.map((esp) => (
              <label key={esp} className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer text-sm" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
                <input type="checkbox" name="especialidades" value={esp} style={{ accentColor: "var(--brand-600)", width: 14, height: 14 }} />
                {esp}
              </label>
            ))}
          </div>
        </div>

        <hr className="divider" />

        <div className="flex gap-3 justify-end">
          <a href="/profissionais" className="btn btn-secondary">Cancelar</a>
          <button type="submit" className="btn btn-primary">Salvar profissional</button>
        </div>
      </form>
    </FormCard>
  );
}
