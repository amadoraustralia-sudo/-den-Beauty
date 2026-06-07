import { createClient } from "@/lib/supabase/server";
import { getSalon } from "@/lib/supabase/salon";
import Topbar from "@/components/Topbar";
import Link from "next/link";
import ClientesBusca from "@/components/ClientesBusca";
import ClienteLinkCard from "@/components/ClienteLinkCard";
import { redirect } from "next/navigation";

interface SearchParams { inativo?: string; toast?: string }

export default async function ClientesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const salon = await getSalon();
  if (!salon) redirect("/setup-salao");
  const s = salon!;

  const salao_id = s.id;
  const limiteInativo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
  const filtroInativo = params.inativo === "true";

  let q = supabase
    .from("clientes")
    .select("id, nome, telefone, email, total_visitas, ultima_visita")
    .eq("salao_id", salao_id)
    .order("nome");
  if (filtroInativo) q = q.or(`ultima_visita.lt.${limiteInativo},ultima_visita.is.null`);
  const { data: clientes } = await q;

  return (
    <>
      <Topbar
        title="Clientes"
        subtitle={filtroInativo ? `${clientes?.length ?? 0} inativos (sem visita há +30 dias)` : `${clientes?.length ?? 0} cadastrados`}
        actions={
          <Link href="/clientes/novo" className="btn btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Novo cliente
          </Link>
        }
      />

      <div className="p-3 lg:p-6 space-y-4">
        {s.slug && (
          <ClienteLinkCard
            nomeEstabelecimento={s.nome_estabelecimento ?? "Salão"}
            slug={s.slug}
          />
        )}
        <div className="card overflow-hidden">
          <ClientesBusca clientes={clientes ?? []} filtroInativo={filtroInativo} />
        </div>
      </div>
    </>
  );
}
