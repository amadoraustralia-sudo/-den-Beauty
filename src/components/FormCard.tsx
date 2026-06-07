import Link from "next/link";

interface FormCardProps {
  title: string;
  subtitle?: string;
  backHref: string;
  children: React.ReactNode;
}

export default function FormCard({ title, subtitle, backHref, children }: FormCardProps) {
  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <Link
          href={backHref}
          className="btn btn-ghost"
          style={{ padding: "0.375rem 0.5rem", color: "var(--text-muted)" }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        </Link>
        <div>
          <h2 style={{ fontSize: "1rem" }}>{title}</h2>
          {subtitle && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{subtitle}</p>}
        </div>
      </div>
      <div className="card p-6">{children}</div>
    </div>
  );
}
