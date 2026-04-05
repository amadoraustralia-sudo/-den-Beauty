import FormCard from "@/components/FormCard";
import { criarProfissional } from "./actions";

const especialidades = ["Corte", "Barba", "Coloração", "Escova", "Progressiva", "Hidratação", "Manicure", "Pedicure", "Design de sobrancelha", "Limpeza de pele", "Maquiagem"];

export default function NovoProfissionalPage() {
  return (
    <FormCard title="Novo profissional" subtitle="Cadastre um profissional do seu salão" backHref="/profissionais">
      <form action={criarProfissional} className="space-y-5">
        <div>
          <h4 className="mb-3" style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Dados pessoais
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Nome completo <span style={{ color: "var(--danger)" }}>*</span></label>
              <input name="nome" required placeholder="Ex: Carla Santos" className="input" />
            </div>
            <div>
              <label className="label">Cargo / Função</label>
              <input name="cargo" placeholder="Ex: Cabeleireira" className="input" />
            </div>
            <div>
              <label className="label">E-mail</label>
              <input name="email" type="email" placeholder="profissional@email.com" className="input" />
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
              <input name="percentual_comissao" type="number" required min="0" max="100" step="0.5" defaultValue="50" className="input" />
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>% sobre cada atendimento concluído</p>
            </div>
            <div>
              <label className="label">Período de fechamento</label>
              <select name="periodo_fechamento" className="input select">
                <option value="semanal">Semanal</option>
                <option value="quinzenal">Quinzenal</option>
                <option value="mensal" selected>Mensal</option>
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
              <label
                key={esp}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer text-sm transition-colors"
                style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
              >
                <input
                  type="checkbox"
                  name="especialidades"
                  value={esp}
                  style={{ accentColor: "var(--brand-600)", width: 14, height: 14 }}
                />
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
