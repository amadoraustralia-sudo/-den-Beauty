import { createClient } from "@/lib/supabase/server";
import BookingFlow from "@/components/BookingFlow";

export default async function NovoAgendamentoPortalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [
    { data: servicos },
    { data: profissionais },
  ] = await Promise.all([
    supabase.from("servicos").select("id, nome, categoria, duracao_min, preco").eq("ativo", true).order("categoria").order("nome"),
    supabase.from("profissionais").select("id, nome, especialidades").eq("ativo", true).order("nome"),
  ]);

  // Busca cliente por auth_user_id ou email
  let clienteId: string | null = null;
  let clienteNome: string | null = null;

  const { data: c1 } = await supabase.from("clientes").select("id, nome").eq("auth_user_id", user.id).single();
  if (c1) { clienteId = c1.id; clienteNome = c1.nome; }
  else if (user.email) {
    const { data: c2 } = await supabase.from("clientes").select("id, nome").eq("email", user.email).single();
    if (c2) { clienteId = c2.id; clienteNome = c2.nome; }
  }

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto lg:max-w-2xl">
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
        successRedirect="/agendar/meus-agendamentos"
      />
    </div>
  );
}
