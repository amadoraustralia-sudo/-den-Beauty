import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PortalNav from "@/components/PortalNav";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/agendar/login");

  // Gestoras/admins não devem acessar a área de cliente
  const role = user.user_metadata?.role as string | undefined;
  if (role === "admin" || role === "super_admin") redirect("/dashboard");

  // Busca nome do cliente
  const { data: cliente } = await supabase
    .from("clientes")
    .select("nome")
    .eq("auth_user_id", user.id)
    .single();

  // Fallback: busca por email se ainda não tem auth_user_id vinculado
  let nomeCliente = cliente?.nome;
  if (!nomeCliente && user.email) {
    const { data: clienteEmail } = await supabase
      .from("clientes")
      .select("nome")
      .eq("email", user.email)
      .single();
    nomeCliente = clienteEmail?.nome;
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen" style={{ backgroundColor: "#F5F0E8" }}>
      <PortalNav nomeCliente={nomeCliente ?? user.email ?? undefined} />
      <main className="flex-1 overflow-auto pb-20 lg:pb-0">
        {children}
      </main>
    </div>
  );
}
