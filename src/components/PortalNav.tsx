"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  {
    href: "/agendar/inicio",
    label: "Início",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    href: "/agendar/novo",
    label: "Agendar",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/>
      </svg>
    ),
    cta: true,
  },
  {
    href: "/agendar/meus-agendamentos",
    label: "Agendamentos",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
  {
    href: "/agendar/perfil",
    label: "Perfil",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
];

export default function PortalNav({ nomeCliente }: { nomeCliente?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/agendar/login");
    router.refresh();
  }

  return (
    <>
      {/* SIDEBAR — desktop */}
      <aside
        className="hidden lg:flex flex-col w-56 flex-shrink-0"
        style={{
          backgroundColor: "var(--brand-800)",
          minHeight: "100vh",
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
      >
        {/* Logo */}
        <div className="px-5 py-5 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--brand-400)" }}>
            <span className="text-xs font-bold text-white">EB</span>
          </div>
          <span className="text-sm font-bold tracking-wide text-white">Éden Beauty</span>
        </div>

        {/* Saudação */}
        {nomeCliente && (
          <div className="px-5 py-3 mb-2">
            <p className="text-xs" style={{ color: "rgb(255 255 255 / 0.5)" }}>Olá,</p>
            <p className="text-sm font-semibold text-white truncate">{nomeCliente.split(" ")[0]}</p>
          </div>
        )}

        {/* Nav links */}
        <nav className="flex-1 px-3 space-y-0.5">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{
                  color: active ? "white" : "rgb(255 255 255 / 0.55)",
                  background: active ? "rgb(255 255 255 / 0.12)" : "transparent",
                }}
              >
                <span style={{ opacity: active ? 1 : 0.7 }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout + link salão */}
        <div className="px-3 py-4 space-y-1" style={{ borderTop: "1px solid rgb(255 255 255 / 0.08)" }}>
          <Link
            href="/agendar"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-colors w-full"
            style={{ color: "rgb(255 255 255 / 0.4)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            Ver página do salão
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs w-full transition-colors"
            style={{ color: "rgb(255 255 255 / 0.4)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sair
          </button>
        </div>
      </aside>

      {/* TOPBAR — mobile */}
      <header
        className="lg:hidden flex items-center justify-between px-4 h-14 flex-shrink-0"
        style={{ backgroundColor: "var(--brand-800)", position: "sticky", top: 0, zIndex: 40 }}
      >
        <Link href="/agendar/inicio" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--brand-400)" }}>
            <span className="text-xs font-bold text-white">EB</span>
          </div>
          <span className="text-sm font-bold text-white">Éden Beauty</span>
        </Link>
        <button onClick={handleLogout} className="text-xs px-3 py-1.5 rounded-lg" style={{ color: "rgb(255 255 255 / 0.55)", background: "rgb(255 255 255 / 0.08)" }}>
          Sair
        </button>
      </header>

      {/* BOTTOM NAV — mobile */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex"
        style={{ backgroundColor: "white", borderTop: "1px solid var(--border)", height: 60 }}
      >
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5"
              style={{
                color: active ? "var(--brand-700)" : "var(--text-muted)",
              }}
            >
              {item.cta ? (
                <span
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: "var(--brand-800)", color: "white" }}
                >
                  {item.icon}
                </span>
              ) : (
                <>
                  {item.icon}
                  <span className="text-xs font-medium" style={{ fontSize: "0.625rem" }}>{item.label}</span>
                </>
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
