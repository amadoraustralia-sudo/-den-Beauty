import FormCard from "@/components/FormCard";
import { criarServico } from "./actions";

const categorias = ["Cabelo", "Barba", "Unhas", "Estética", "Sobrancelha", "Maquiagem", "Outro"];

function erroStyle(erros: string[], campo: string) {
  return erros.includes(campo) ? { borderColor: "var(--danger)", boxShadow: "0 0 0 2px rgb(239 68 68 / 0.15)" } : {};
}

export default async function NovoServicoPage({
  searchParams,
}: {
  searchParams: Promise<{ erros?: string; erro?: string; msg?: string }>;
}) {
  const { erros: errosStr, erro, msg } = await searchParams;
  const erros = errosStr ? errosStr.split(",") : [];

  return (
    <FormCard title="Novo serviço" subtitle="Adicione um serviço ao catálogo" backHref="/servicos">
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

      <form action={criarServico} className="space-y-5">
        <div>
          <h4 className="mb-3" style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Informações do serviço
          </h4>
          <div className="space-y-4">
            <div>
              <label className="label">Nome do serviço <span style={{ color: "var(--danger)" }}>*</span></label>
              <input name="nome" placeholder="Ex: Corte + Escova" className="input" style={erroStyle(erros, "nome")} />
              {erros.includes("nome") && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>Campo obrigatório</p>}
            </div>
            <div>
              <label className="label">Categoria <span style={{ color: "var(--danger)" }}>*</span></label>
              <select name="categoria" className="input select" style={erroStyle(erros, "categoria")}>
                <option value="">Selecione...</option>
                {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {erros.includes("categoria") && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>Selecione uma categoria</p>}
            </div>
            <div>
              <label className="label">Descrição</label>
              <textarea name="descricao" rows={3} placeholder="Descreva os detalhes do serviço ao cliente..." className="input" style={{ resize: "vertical" }} />
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
              <input name="duracao_min" type="number" min="5" step="5" placeholder="60" className="input" style={erroStyle(erros, "duracao_min")} />
              {erros.includes("duracao_min") && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>Campo obrigatório</p>}
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Usado para bloquear a agenda</p>
            </div>
            <div>
              <label className="label">Preço (R$) <span style={{ color: "var(--danger)" }}>*</span></label>
              <input name="preco" type="number" min="0" step="0.01" placeholder="0,00" className="input" style={erroStyle(erros, "preco")} />
              {erros.includes("preco") && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>Campo obrigatório</p>}
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
