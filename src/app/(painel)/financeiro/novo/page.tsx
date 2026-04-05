import Topbar from "@/components/Topbar";
import Link from "next/link";
import { criarLancamento } from "./actions";

const CATEGORIAS_ENTRADA = ["Serviço", "Produto", "Gorjeta", "Outros"];
const CATEGORIAS_SAIDA   = ["Aluguel", "Produto / Insumo", "Salário", "Equipamento", "Marketing", "Utilidades", "Outros"];

export default async function NovoLancamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; erro?: string }>;
}) {
  const { tipo: tipoParam, erro } = await searchParams;
  const hoje = new Date().toISOString().split("T")[0];

  return (
    <>
      <Topbar
        title="Novo lançamento"
        subtitle="Registre uma receita ou despesa"
      />

      <div className="p-6 max-w-lg">
        {erro === "campos" && (
          <div className="mb-4 rounded-xl p-4" style={{ background: "#fff5f5", border: "1px solid #fecaca" }}>
            <p className="text-sm" style={{ color: "#b91c1c" }}>Preencha todos os campos obrigatórios.</p>
          </div>
        )}

        <div className="card p-6">
          <form action={criarLancamento} className="space-y-5">
            {/* Tipo */}
            <div>
              <label className="label">Tipo *</label>
              <div className="grid grid-cols-2 gap-3 mt-1.5">
                {[
                  { val: "entrada", label: "Entrada (receita)", color: "var(--success)" },
                  { val: "saida",   label: "Saída (despesa)",   color: "var(--danger)"  },
                ].map((t) => (
                  <label
                    key={t.val}
                    className="flex items-center gap-2 p-3 rounded-xl cursor-pointer"
                    style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
                  >
                    <input
                      type="radio"
                      name="tipo"
                      value={t.val}
                      defaultChecked={t.val === (tipoParam ?? "entrada")}
                      required
                      style={{ accentColor: t.color }}
                    />
                    <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {t.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Descrição */}
            <div>
              <label className="label">Descrição *</label>
              <input
                type="text"
                name="descricao"
                className="input"
                placeholder="Ex: Corte e escova, Conta de energia…"
                required
                maxLength={120}
              />
            </div>

            {/* Valor e data */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Valor (R$) *</label>
                <input
                  type="number"
                  name="valor"
                  className="input"
                  placeholder="0,00"
                  step="0.01"
                  min="0.01"
                  required
                />
              </div>
              <div>
                <label className="label">Data *</label>
                <input
                  type="date"
                  name="data"
                  className="input"
                  defaultValue={hoje}
                  required
                />
              </div>
            </div>

            {/* Categoria */}
            <div>
              <label className="label">Categoria</label>
              <select name="categoria" className="input">
                <option value="">Sem categoria</option>
                <optgroup label="Entradas">
                  {CATEGORIAS_ENTRADA.map((c) => <option key={c} value={c}>{c}</option>)}
                </optgroup>
                <optgroup label="Saídas">
                  {CATEGORIAS_SAIDA.map((c) => <option key={c} value={c}>{c}</option>)}
                </optgroup>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <Link href="/financeiro" className="btn flex-1 text-center">
                Cancelar
              </Link>
              <button type="submit" className="btn btn-primary flex-1">
                Salvar lançamento
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
