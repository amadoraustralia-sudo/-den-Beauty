import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ClienteNav from "@/components/ClienteNav";

export default async function ClienteLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <ClienteNav />
      <main className="max-w-2xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
