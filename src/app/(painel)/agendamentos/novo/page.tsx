import FormCard from "@/components/FormCard";
import { createClient } from "@/lib/supabase/server";
import NovoAgendamentoForm from "./NovoAgendamentoForm";

export default async function NovoAgendamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const { cliente: clienteParam } = await searchParams;
  const supabase = await createClient();

  const [{ data: clientes }, { data: servicos }, { data: profissionais }, { data: profile }] = await Promise.all([
    supabase.from("clientes").select("id, nome").order("nome"),
    supabase.from("servicos").select("id, nome, preco, duracao_min").eq("ativo", true).order("nome"),
    supabase.from("profissionais").select("id, nome").eq("ativo", true).order("nome"),
    supabase.from("profiles").select("salao_id").single(),
  ]);

  const hoje = new Date().toISOString().split("T")[0];

  return (
    <FormCard title="Novo agendamento" subtitle="Registre um agendamento para o salão" backHref="/agendamentos">
      <NovoAgendamentoForm
        clientes={clientes ?? []}
        servicos={servicos ?? []}
        profissionais={profissionais ?? []}
        clienteInicial={clienteParam}
        hoje={hoje}
        salaoId={profile?.salao_id ?? null}
      />
    </FormCard>
  );
}
