import { createClient } from "@/lib/supabase/server";
import BookingFlow from "@/components/BookingFlow";
import Link from "next/link";

export default async function AgendarPage() {
  const supabase = await createClient();

  const [
    { data: servicos },
    { data: profissionais },
    { data: config },
    { data: { user } },
  ] = await Promise.all([
    supabase.from("servicos").select("id, nome, categoria, duracao_min, preco").eq("ativo", true).order("categoria").order("nome"),
    supabase.from("profissionais").select("id, nome, especialidades").eq("ativo", true).order("nome"),
    supabase.from("configuracoes").select("*").limit(1).single(),
    supabase.auth.getUser(),
  ]);

  // Busca cliente se logado
  let clienteId: string | null = null;
  let clienteNome: string | null = null;
  if (user?.email) {
    const { data: cliente } = await supabase
      .from("clientes")
      .select("id, nome")
      .eq("email", user.email)
      .single();
    clienteId = cliente?.id ?? null;
    clienteNome = cliente?.nome ?? null;
  }

  const nomeEstabelecimento = config?.nome_estabelecimento ?? "Nosso Salão";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      {/* Header público */}
      <header style={{ backgroundColor: "var(--brand-800)", borderBottom: "1px solid rgb(255 255 255 / 0.08)" }}>
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--brand-400)" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m14.7 6.3-8.4 8.4a1 1 0 0 0-.3.7V18h2.6a1 1 0 0 0 .7-.3l8.4-8.4"/>
                <path d="m16 4 4 4"/>
              </svg>
            </div>
            <span className="text-sm font-semibold" style={{ color: "white" }}>{nomeEstabelecimento}</span>
          </div>
          {user ? (
            <Link href="/minha-conta" className="text-xs px-3 py-1.5 rounded-lg" style={{ color: "rgb(255 255 255 / 0.7)", background: "rgb(255 255 255 / 0.1)" }}>
              Minha conta
            </Link>
          ) : (
            <Link href="/login" className="text-xs px-3 py-1.5 rounded-lg" style={{ color: "rgb(255 255 255 / 0.7)", background: "rgb(255 255 255 / 0.1)" }}>
              Entrar
            </Link>
          )}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 style={{ fontSize: "1.375rem" }}>Agendar serviço</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Escolha o serviço, profissional e horário de sua preferência.
          </p>
        </div>

        <BookingFlow
          servicos={servicos ?? []}
          profissionais={profissionais ?? []}
          clienteId={clienteId}
          clienteNome={clienteNome}
          isLogado={!!user}
        />
      </div>
    </div>
  );
}
