import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import PortalNav from "@/components/PortalNav";

export default async function SlugPortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: configRows } = await supabase.rpc("get_configuracoes_portal", { p_slug: slug });
  const config = (configRows as any[])?.[0] ?? null;
  if (!config) notFound();

  // Verifica autenticação do cliente
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${slug}/login`);

  // Busca nome do cliente
  const { data: cliente } = await supabase
    .from("clientes")
    .select("nome")
    .eq("auth_user_id", user.id)
    .single();

  let nomeCliente = cliente?.nome;
  if (!nomeCliente && user.email) {
    const { data: c2 } = await supabase
      .from("clientes")
      .select("nome")
      .eq("email", user.email)
      .single();
    nomeCliente = c2?.nome;
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen" style={{ backgroundColor: "#F5F0E8" }}>
      <PortalNav
        nomeCliente={nomeCliente ?? user.email ?? undefined}
        slug={slug}
        salonName={config.nome_estabelecimento ?? undefined}
        salonLogoUrl={(config as any).logo_url ?? undefined}
      />
      <main className="flex-1 overflow-auto pb-20 lg:pb-0">
        {children}
      </main>
    </div>
  );
}
