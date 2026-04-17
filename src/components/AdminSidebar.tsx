"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  {
    href: "/admin",
    label: "Visão Geral",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  },
  {
    href: "/admin/saloes",
    label: "Salões",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="hidden lg:flex flex-col flex-shrink-0"
      style={{ width: "var(--sidebar-w)", height: "100vh", position: "sticky", top: 0, backgroundColor: "#0f1a10", borderRight: "1px solid rgb(255 255 255 / 0.06)" }}>

      {/* Logo */}
      <div className="px-5 py-5 border-b" style={{ borderColor: "rgb(255 255 255 / 0.08)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--brand-400)" }}>
            <span className="text-xs font-bold text-white">SA</span>
          </div>
          <div>
            <p className="font-bold text-sm leading-none tracking-wide text-white">Éden Platform</p>
            <p className="text-xs mt-0.5" style={{ color: "rgb(255 255 255 / 0.4)" }}>Super Admin</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={`nav-item ${isActive ? "active" : ""}`}>
              <span className="nav-item-icon">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t" style={{ borderColor: "rgb(255 255 255 / 0.08)" }}>
        <Link href="/admin/saloes" className="nav-item mb-1 block">
          <svg className="nav-item-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          edenteam777
        </Link>
        <button onClick={handleLogout} className="nav-item w-full">
          <svg className="nav-item-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Sair
        </button>
      </div>
    </aside>
  );
}
