import Topbar from "@/components/Topbar";
import Link from "next/link";
import { criarLancamento } from "./actions";

const CATEGORIAS = ["Serviço", "Produto", "Gorjeta", "Aluguel", "Produto / Insumo", "Salário", "Equipamento", "Marketing", "Utilidades", "Outros"];

function erroStyle(erros: string[], campo: string) {
  return erros.includes(campo) ? { borderColor: "var(--danger)", boxShadow: "0 0 0 2px rgb(239 68 68 / 0.15)" } : {};
}

export default async function NovoLancamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; erros?: string; erro?: string; msg?: string; descricao?: string; valor?: string; data?: string }>;
}) {
  const { tipo: tipoParam, erros: errosStr, erro, msg, descricao: descParam, valor: valorParam, data: dataParam } = await searchParams;
  const erros = errosStr ? errosStr.split(",") : [];
  const hoje = new Date().toISOString().split("T")[0];

  return (
    <>
      <Topbar title="Novo lançamento" subtitle="Registre uma receita ou despesa" />

      <div className="p-6 max-w-lg">
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

        <div className="card p-6">
          <form action={criarLancamento} className="space-y-5">
            <div>
              <label className="label">Tipo *</label>
              <div className="grid grid-cols-2 gap-3 mt-1.5" style={erroStyle(erros, "tipo")}>
                {[
                  { val: "entrada", label: "Entrada (receita)", color: "var(--success)" },
                  { val: "saida",   label: "Saída (despesa)",   color: "var(--danger)"  },
                ].map((t) => (
                  <label key={t.val} className="flex items-center gap-2 p-3 rounded-xl cursor-pointer" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
                    <input type="radio" name="tipo" value={t.val} defaultChecked={t.val === (tipoParam ?? "entrada")} style={{ accentColor: t.color }} />
                    <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{t.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Descrição *</label>
              <input type="text" name="descricao" className="input" placeholder="Ex: Corte e escova, Conta de energia…" maxLength={120} defaultValue={descParam ?? ""} style={erroStyle(erros, "descricao")} />
              {erros.includes("descricao") && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>Campo obrigatório</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Valor (R$) *</label>
                <input type="number" name="valor" className="input" placeholder="0,00" step="0.01" min="0.01" defaultValue={valorParam ?? ""} style={erroStyle(erros, "valor")} />
                {erros.includes("valor") && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>Valor inválido</p>}
              </div>
              <div>
                <label className="label">Data *</label>
                <input type="date" name="data" className="input" defaultValue={dataParam ?? hoje} style={erroStyle(erros, "data")} />
                {erros.includes("data") && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>Campo obrigatório</p>}
              </div>
            </div>

            <div>
              <label className="label">Categoria</label>
              <select name="categoria" className="input">
                <option value="">Sem categoria</option>
                {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <Link href="/financeiro" className="btn flex-1 text-center">Cancelar</Link>
              <button type="submit" className="btn btn-primary flex-1">Salvar lançamento</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
