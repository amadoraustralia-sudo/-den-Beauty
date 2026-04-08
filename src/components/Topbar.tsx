"use client";

interface TopbarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function Topbar({ title, subtitle, actions }: TopbarProps) {
  function toggleSidebar() {
    window.dispatchEvent(new Event("toggle-sidebar"));
  }

  return (
    <header
      className="sticky top-0 z-10 flex items-center justify-between px-4 lg:px-8 py-3 lg:py-4"
      style={{
        backgroundColor: "var(--bg)",
        borderBottom: "1px solid var(--border)",
        minHeight: "56px",
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburguer — só no mobile */}
        <button
          className="lg:hidden flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg transition-colors"
          style={{ color: "var(--text-secondary)" }}
          onClick={toggleSidebar}
          aria-label="Abrir menu"
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-raised)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <div className="min-w-0">
          <h1 className="page-title truncate" style={{ fontSize: "1rem" }}>{title}</h1>
          {subtitle && <p className="page-subtitle truncate hidden sm:block">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </header>
  );
}
