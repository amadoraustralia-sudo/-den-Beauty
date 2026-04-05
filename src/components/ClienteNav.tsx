"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/minha-conta", label: "Início" },
  { href: "/minha-conta/agendamentos", label: "Meus agendamentos" },
  { href: "/minha-conta/perfil", label: "Meu perfil" },
];

export default function ClienteNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header style={{ backgroundColor: "var(--brand-800)", borderBottom: "1px solid rgb(255 255 255 / 0.08)" }}>
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/minha-conta" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--brand-400)" }}>
              <span className="text-xs font-bold" style={{ color: "white" }}>EB</span>
            </div>
            <span className="text-sm font-bold tracking-wide" style={{ color: "white" }}>Éden Beauty</span>
          </Link>

          {/* Nav links */}
          <nav className="hidden sm:flex items-center gap-1">
            {links.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={{
                    color: active ? "white" : "rgb(255 255 255 / 0.55)",
                    background: active ? "rgb(255 255 255 / 0.12)" : "transparent",
                  }}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/agendar"
              className="btn"
              style={{
                fontSize: "0.75rem",
                padding: "0.375rem 0.75rem",
                backgroundColor: "var(--brand-400)",
                color: "white",
                border: "none",
              }}
            >
              + Agendar
            </Link>
            <button
              onClick={handleLogout}
              className="px-2 py-1.5 rounded-lg text-xs transition-colors"
              style={{ color: "rgb(255 255 255 / 0.4)" }}
            >
              Sair
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="flex sm:hidden gap-1 pb-2 overflow-x-auto">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className="px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0"
                style={{
                  color: active ? "white" : "rgb(255 255 255 / 0.55)",
                  background: active ? "rgb(255 255 255 / 0.12)" : "transparent",
                }}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
