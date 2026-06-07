"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  {
    href: "/dashboard",
    label: "Início",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
  },
  {
    href: "/agenda",
    label: "Agenda",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
      </svg>
    ),
  },
  {
    href: "/agendamentos/novo",
    label: "Agendar",
    isAction: true,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    ),
  },
  {
    href: "/clientes",
    label: "Clientes",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    href: "/financeiro",
    label: "Financeiro",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
  },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex items-stretch"
      style={{
        height: 60,
        backgroundColor: "var(--surface)",
        borderTop: "1px solid var(--border)",
        boxShadow: "0 -4px 16px rgb(0 0 0 / 0.06)",
      }}
    >
      {items.map((item) => {
        const isActive = !item.isAction && (pathname === item.href || pathname.startsWith(item.href + "/"));
        if (item.isAction) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center flex-1"
            >
              <div
                className="flex items-center justify-center w-11 h-11 rounded-full -mt-5"
                style={{
                  backgroundColor: "var(--brand-800)",
                  boxShadow: "0 2px 12px rgb(28 43 30 / 0.4)",
                }}
              >
                <span style={{ color: "white" }}>{item.icon}</span>
              </div>
            </Link>
          );
        }
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center flex-1 gap-0.5 pt-1"
            style={{
              color: isActive ? "var(--brand-600)" : "var(--text-muted)",
              textDecoration: "none",
              transition: "color 0.15s",
            }}
          >
            {item.icon}
            <span style={{ fontSize: "0.625rem", fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
            {isActive && (
              <span
                style={{
                  position: "absolute",
                  top: 0,
                  width: 24,
                  height: 2,
                  borderRadius: 2,
                  backgroundColor: "var(--brand-600)",
                }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
