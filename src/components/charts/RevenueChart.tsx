"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

interface Props {
  data: { dia: string; receita: number; semanaAnterior: number }[];
}

function formatCurrency(v: number) {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card" style={{ padding: "0.625rem 0.875rem", fontSize: "0.8125rem", minWidth: 160 }}>
      <p style={{ color: "var(--text-muted)", marginBottom: 6 }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2" style={{ marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, display: "inline-block" }} />
          <span style={{ color: "var(--text-secondary)" }}>{p.name}:</span>
          <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function RevenueChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#3D6B44" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#3D6B44" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorAnterior" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#B3D4B8" stopOpacity={0.1} />
            <stop offset="95%" stopColor="#B3D4B8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="dia"
          tick={{ fontSize: 11, fill: "var(--text-muted)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--text-muted)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="semanaAnterior"
          name="Semana anterior"
          stroke="var(--brand-200)"
          strokeWidth={1.5}
          strokeDasharray="4 3"
          fill="url(#colorAnterior)"
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="receita"
          name="Esta semana"
          stroke="var(--brand-500)"
          strokeWidth={2}
          fill="url(#colorReceita)"
          dot={false}
          activeDot={{ r: 4, fill: "var(--brand-500)", strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
