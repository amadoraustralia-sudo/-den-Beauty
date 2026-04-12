"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  data: { name: string; value: number; color: string }[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="card" style={{ padding: "0.5rem 0.75rem", fontSize: "0.8125rem" }}>
      <span style={{ color: "var(--text-secondary)" }}>{d.name}: </span>
      <span style={{ fontWeight: 600 }}>{d.value}%</span>
    </div>
  );
};

export default function PaymentPieChart({ data }: Props) {
  const semDados = data.length === 0 || (data.length === 1 && data[0].name === "Sem dados");

  if (semDados) {
    return (
      <div className="flex flex-col items-center justify-center py-6 gap-2" style={{ color: "var(--text-muted)" }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity={0.4}>
          <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
        </svg>
        <p className="text-sm text-center" style={{ color: "var(--text-muted)" }}>
          Sem dados suficientes para exibir
        </p>
        <p className="text-xs text-center" style={{ color: "var(--text-muted)", opacity: 0.7 }}>
          Conclua atendimentos com forma de pagamento
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-5">
      <ResponsiveContainer width={100} height={100}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={28}
            outerRadius={46}
            paddingAngle={2}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      <div className="space-y-1.5 flex-1">
        {data.map((d) => (
          <div key={d.name} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: d.color, display: "inline-block", flexShrink: 0 }} />
              <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{d.name}</span>
            </div>
            <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)" }}>{d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
