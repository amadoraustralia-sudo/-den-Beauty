import { Suspense } from "react";
import Sidebar from "@/components/Sidebar";
import Toaster from "@/components/Toaster";
import MobileBottomNav from "@/components/MobileBottomNav";
import SalonSetupGuard from "@/components/SalonSetupGuard";
import { getSalon } from "@/lib/supabase/salon";

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const salon = await getSalon();
  const initialLogoUrl = (salon as any)?.logo_url ?? null;
  const initialSalonName = salon?.nome_estabelecimento ?? null;

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "var(--bg)" }}>
      <SalonSetupGuard />
      <Sidebar initialLogoUrl={initialLogoUrl} initialSalonName={initialSalonName} />
      <div className="flex-1 flex flex-col min-w-0 overflow-auto pb-16 lg:pb-0">
        {children}
      </div>
      <MobileBottomNav />
      <Suspense>
        <Toaster />
      </Suspense>
    </div>
  );
}
