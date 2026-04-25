import { createClient } from "@/lib/supabase/server";
import { getSalaoId } from "@/lib/supabase/salon";
import { NextRequest, NextResponse } from "next/server";

function getUltimoDia(mes: string) {
  const [ano, m] = mes.split("-").map(Number);
  return new Date(ano, m, 0).getDate();
}

function escapeCsv(val: string | number | null | undefined): string {
  if (val == null) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(req: NextRequest) {
  const salao_id = await getSalaoId();
  if (!salao_id) return new NextResponse("Unauthorized", { status: 401 });

  const mesParam = req.nextUrl.searchParams.get("mes");
  const mes = mesParam ?? new Date().toISOString().slice(0, 7);
  const inicio = `${mes}-01`;
  const fim    = `${mes}-${String(getUltimoDia(mes)).padStart(2, "0")}`;

  const supabase = await createClient();
  const { data: transacoes } = await supabase
    .from("transacoes")
    .select("tipo, descricao, valor, data, categoria")
    .eq("salao_id", salao_id)
    .gte("data", inicio)
    .lte("data", fim)
    .order("data")
    .order("created_at");

  const header = "Tipo,Descrição,Valor,Data,Categoria\n";
  const rows = (transacoes ?? [])
    .map((t) => [
      escapeCsv(t.tipo === "entrada" ? "Receita" : "Despesa"),
      escapeCsv(t.descricao),
      escapeCsv(Number(t.valor).toFixed(2).replace(".", ",")),
      escapeCsv(new Date(t.data + "T00:00:00").toLocaleDateString("pt-BR")),
      escapeCsv(t.categoria),
    ].join(","))
    .join("\n");

  const csv = "\uFEFF" + header + rows; // BOM for Excel UTF-8
  const filename = `financeiro-${mes}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
