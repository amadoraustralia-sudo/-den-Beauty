import FormCard from "@/components/FormCard";
import { criarServico } from "./actions";

const categorias = ["Cabelo", "Barba", "Unhas", "Estética", "Sobrancelha", "Maquiagem", "Outro"];

export default function NovoServicoPage() {
  return (
    <FormCard title="Novo serviço" subtitle="Adicione um serviço ao catálogo" backHref="/servicos">
      <form action={criarServico} className="space-y-5">
        <div>
          <h4 className="mb-3" style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Informações do serviço
          </h4>
          <div className="space-y-4">
            <div>
              <label className="label">Nome do serviço <span style={{ color: "var(--danger)" }}>*</span></label>
              <input name="nome" required placeholder="Ex: Corte + Escova" className="input" />
            </div>
            <div>
              <label className="label">Categoria <span style={{ color: "var(--danger)" }}>*</span></label>
              <select name="categoria" required className="input select">
                <option value="">Selecione...</option>
                {categorias.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <hr className="divider" />

        <div>
          <h4 className="mb-3" style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Tempo e preço
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Duração (minutos) <span style={{ color: "var(--danger)" }}>*</span></label>
              <input name="duracao_min" type="number" required min="5" step="5" placeholder="60" className="input" />
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Usado para bloquear a agenda</p>
            </div>
            <div>
              <label className="label">Preço (R$) <span style={{ color: "var(--danger)" }}>*</span></label>
              <input name="preco" type="number" required min="0" step="0.01" placeholder="0,00" className="input" />
            </div>
          </div>
        </div>

        <hr className="divider" />

        <div className="flex gap-3 justify-end">
          <a href="/servicos" className="btn btn-secondary">Cancelar</a>
          <button type="submit" className="btn btn-primary">Salvar serviço</button>
        </div>
      </form>
    </FormCard>
  );
}
