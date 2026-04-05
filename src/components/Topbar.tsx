"use client";

interface TopbarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function Topbar({ title, subtitle, actions }: TopbarProps) {
  return (
    <header
      className="sticky top-0 z-10 flex items-center justify-between px-8 py-4"
      style={{
        backgroundColor: "var(--bg)",
        borderBottom: "1px solid var(--border)",
        minHeight: "64px",
      }}
    >
      <div>
        <h1 className="page-title" style={{ fontSize: "1.0625rem" }}>{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
