import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import BookingFlow from "@/components/BookingFlow";

export default async function NovoAgendamentoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: config } = await supabase
    .from("configuracoes").select("id").eq("slug", slug).single();
  if (!config) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: servicos }, { data: profissionais }] = await Promise.all([
    supabase.from("servicos")
      .select("id, nome, categoria, duracao_min, preco")
      .eq("salao_id", config.id).eq("ativo", true).gt("preco", 0)
      .order("categoria").order("nome"),
    supabase.from("profissionais")
      .select("id, nome, especialidades")
      .eq("salao_id", config.id).eq("ativo", true)
      .order("nome"),
  ]);

  // Resolve cliente — tenta por auth_user_id, depois por email, depois auto-cria
  let clienteId: string | null = null;
  let clienteNome: string | null = null;

  const { data: c1 } = await supabase
    .from("clientes").select("id, nome")
    .eq("auth_user_id", user.id).eq("salao_id", config.id).maybeSingle();
  if (c1) { clienteId = c1.id; clienteNome = c1.nome; }

  if (!clienteId && user.email) {
    const { data: c2 } = await supabase
      .from("clientes").select("id, nome")
      .eq("email", user.email).eq("salao_id", config.id).maybeSingle();
    if (c2) {
      clienteId = c2.id; clienteNome = c2.nome;
      // Vincula auth_user_id para próximas buscas
      await supabase.from("clientes").update({ auth_user_id: user.id }).eq("id", c2.id);
    }
  }

  // Auto-cria o cliente se ainda não existe (primeira vez no salão)
  if (!clienteId) {
    const nomeDoUsuario = (user.user_metadata?.nome as string | undefined)
      ?? user.user_metadata?.full_name as string | undefined
      ?? user.email?.split("@")[0]
      ?? "Cliente";
    const { data: criado } = await supabase
      .from("clientes")
      .insert({
        salao_id: config.id,
        nome: nomeDoUsuario,
        email: user.email ?? null,
        auth_user_id: user.id,
      })
      .select("id, nome")
      .single();
    if (criado) { clienteId = criado.id; clienteNome = criado.nome; }
  }

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Novo agendamento</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Escolha o serviço, profissional e horário de sua preferência.
        </p>
      </div>

      <BookingFlow
        servicos={servicos ?? []}
        profissionais={profissionais ?? []}
        clienteId={clienteId}
        clienteNome={clienteNome}
        isLogado={true}
        salaoId={config.id}
        successRedirect={`/${slug}/meus-agendamentos`}
      />
    </div>
  );
}
