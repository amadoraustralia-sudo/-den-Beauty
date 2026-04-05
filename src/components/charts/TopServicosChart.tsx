"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface Props {
  data: { nome: string; total: number }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card" style={{ padding: "0.5rem 0.75rem", fontSize: "0.8125rem" }}>
      <p style={{ color: "var(--text-muted)", marginBottom: 2 }}>{label}</p>
      <span style={{ fontWeight: 600 }}>R$ {payload[0].value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
    </div>
  );
};

export default function TopServicosChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
        <XAxis
          type="number"
          tick={{ fontSize: 10, fill: "var(--text-muted)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
        />
        <YAxis
          type="category"
          dataKey="nome"
          tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
          axisLine={false}
          tickLine={false}
          width={90}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--bg-subtle)" }} />
        <Bar dataKey="total" radius={[0, 4, 4, 0]} barSize={16}>
          {data.map((_, i) => (
            <Cell key={i} fill={i === 0 ? "var(--brand-500)" : i === 1 ? "var(--brand-300)" : "var(--brand-200)"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
