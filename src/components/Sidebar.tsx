"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const navGroups = [
  {
    label: null,
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
            <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
          </svg>
        ),
      },
      {
        href: "/agenda",
        label: "Agenda",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
          </svg>
        ),
      },
    ],
  },
  {
    label: "Gestão",
    items: [
      {
        href: "/clientes",
        label: "Clientes",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        ),
      },
      {
        href: "/agendamentos",
        label: "Agendamentos",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
        ),
      },
      {
        href: "/profissionais",
        label: "Profissionais",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
        ),
      },
      {
        href: "/servicos",
        label: "Serviços",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="m14.7 6.3-8.4 8.4a1 1 0 0 0-.3.7V18h2.6a1 1 0 0 0 .7-.3l8.4-8.4"/>
            <path d="m16 4 4 4"/><path d="M5 20H3v-2"/>
          </svg>
        ),
      },
    ],
  },
  {
    label: "Financeiro",
    items: [
      {
        href: "/financeiro",
        label: "Financeiro",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        ),
      },
      {
        href: "/relatorios",
        label: "Relatórios",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
        ),
      },
    ],
  },
  {
    label: "Sistema",
    items: [
      {
        href: "/configuracoes",
        label: "Configurações",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        ),
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [salonName, setSalonName] = useState("Éden Beauty");
  const [salonInitials, setSalonInitials] = useState("EB");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("configuracoes")
        .select("nome_estabelecimento")
        .eq("owner_user_id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.nome_estabelecimento) {
            setSalonName(data.nome_estabelecimento);
            const initials = data.nome_estabelecimento
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((w: string) => w[0].toUpperCase())
              .join("");
            setSalonInitials(initials);
          }
        });
    });
  }, []);

  // Escuta evento do botão hamburguer no Topbar
  useEffect(() => {
    function toggle() { setMobileOpen((v) => !v); }
    window.addEventListener("toggle-sidebar", toggle);
    return () => window.removeEventListener("toggle-sidebar", toggle);
  }, []);

  // Fecha ao navegar
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const sidebarContent = (
    <aside
      className="flex flex-col h-full"
      style={{ backgroundColor: "var(--brand-800)", borderRight: "1px solid rgb(255 255 255 / 0.06)" }}
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b flex items-center justify-between" style={{ borderColor: "rgb(255 255 255 / 0.08)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--brand-400)" }}>
            <span className="text-xs font-bold" style={{ color: "white" }}>{salonInitials}</span>
          </div>
          <div>
            <p className="font-bold text-sm leading-none tracking-wide" style={{ color: "white" }}>{salonName}</p>
            <p className="text-xs mt-0.5" style={{ color: "rgb(255 255 255 / 0.4)" }}>Gestão</p>
          </div>
        </div>
        {/* Botão fechar no mobile */}
        <button
          className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg"
          style={{ color: "rgb(255 255 255 / 0.6)" }}
          onClick={() => setMobileOpen(false)}
          aria-label="Fechar menu"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <p className="px-3 mb-1 text-xs font-semibold uppercase tracking-widest" style={{ color: "rgb(255 255 255 / 0.25)" }}>
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link key={item.href} href={item.href} className={`nav-item ${isActive ? "active" : ""}`}>
                    <span className="nav-item-icon">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t" style={{ borderColor: "rgb(255 255 255 / 0.08)" }}>
        <button onClick={handleLogout} className="nav-item w-full">
          <svg className="nav-item-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sair
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop: sidebar fixa */}
      <div
        className="hidden lg:flex flex-col flex-shrink-0"
        style={{ width: "var(--sidebar-w)", height: "100vh", position: "sticky", top: 0 }}
      >
        {sidebarContent}
      </div>

      {/* Mobile: overlay + drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          {/* Fundo escuro */}
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <div
            className="relative flex flex-col z-50"
            style={{ width: 280, height: "100%", animation: "slideInLeft 0.22s ease" }}
          >
            {sidebarContent}
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); opacity: 0.5; }
          to   { transform: translateX(0);     opacity: 1; }
        }
      `}</style>
    </>
  );
}
