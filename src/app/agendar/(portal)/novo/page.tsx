import { createClient } from "@/lib/supabase/server";
import BookingFlow from "@/components/BookingFlow";

export default async function NovoAgendamentoPortalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Busca cliente por auth_user_id ou email
  let clienteId: string | null = null;
  let clienteNome: string | null = null;
  let salaoId: string | null = null;

  const { data: c1 } = await supabase.from("clientes").select("id, nome, salao_id").eq("auth_user_id", user.id).maybeSingle();
  if (c1) { clienteId = c1.id; clienteNome = c1.nome; salaoId = c1.salao_id; }

  if (!clienteId && user.email) {
    const { data: c2 } = await supabase.from("clientes").select("id, nome, salao_id").eq("email", user.email).maybeSingle();
    if (c2) {
      clienteId = c2.id; clienteNome = c2.nome; salaoId = c2.salao_id;
      await supabase.from("clientes").update({ auth_user_id: user.id }).eq("id", c2.id);
    }
  }

  const [
    { data: servicos },
    { data: profissionais },
    { data: config },
  ] = await Promise.all([
    salaoId
      ? supabase.from("servicos").select("id, nome, categoria, duracao_min, preco").eq("salao_id", salaoId).eq("ativo", true).gt("preco", 0).order("categoria").order("nome")
      : Promise.resolve({ data: [] }),
    salaoId
      ? supabase.from("profissionais").select("id, nome, especialidades").eq("salao_id", salaoId).eq("ativo", true).order("nome")
      : Promise.resolve({ data: [] }),
    salaoId
      ? supabase.from("configuracoes").select("dias_funcionamento").eq("id", salaoId).limit(1).single()
      : Promise.resolve({ data: null }),
  ]);

  const diasFuncionamento: string[] = config?.dias_funcionamento ?? ["seg", "ter", "qua", "qui", "sex", "sab"];

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
        salaoId={salaoId}
        diasFuncionamento={diasFuncionamento}
        successRedirect="/agendar/meus-agendamentos"
      />
    </div>
  );
}
