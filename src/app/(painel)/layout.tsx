import { Suspense } from "react";
import Sidebar from "@/components/Sidebar";
import Toaster from "@/components/Toaster";
import MobileBottomNav from "@/components/MobileBottomNav";

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "var(--bg)" }}>
      <Sidebar />
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
