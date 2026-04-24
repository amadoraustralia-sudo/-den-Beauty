"use client";

import dynamic from "next/dynamic";

const RevenueChart     = dynamic(() => import("./RevenueChart"),     { ssr: false });
const PaymentPieChart  = dynamic(() => import("./PaymentPieChart"),  { ssr: false });
const TopServicosChart = dynamic(() => import("./TopServicosChart"), { ssr: false });

interface ChartData { dia: string; receita: number; semanaAnterior: number }
interface PagamentoData { name: string; value: number; color: string }
interface ServicoData { nome: string; total: number }

export function RevenueChartClient({ data }: { data: ChartData[] }) {
  return <RevenueChart data={data} />;
}

export function PaymentPieChartClient({ data }: { data: PagamentoData[] }) {
  return <PaymentPieChart data={data} />;
}

export function TopServicosChartClient({ data }: { data: ServicoData[] }) {
  return <TopServicosChart data={data} />;
}
