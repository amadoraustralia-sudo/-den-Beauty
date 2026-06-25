import FormCard from "@/components/FormCard";
import { createClient } from "@/lib/supabase/server";
import { getSalaoId } from "@/lib/supabase/salon";
import NovoAgendamentoForm from "./NovoAgendamentoForm";

export default async function NovoAgendamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const { cliente: clienteParam } = await searchParams;
  const supabase = await createClient();
  const salao_id = await getSalaoId();

  const [{ data: clientes }, { data: servicos }, { data: profissionais }] = await Promise.all([
    supabase.from("clientes").select("id, nome").eq("salao_id", salao_id ?? "").order("nome"),
    supabase.from("servicos").select("id, nome, preco, duracao_min").eq("salao_id", salao_id ?? "").eq("ativo", true).order("nome"),
    supabase.from("profissionais").select("id, nome").eq("salao_id", salao_id ?? "").eq("ativo", true).order("nome"),
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
        salaoId={salao_id ?? null}
      />
    </FormCard>
  );
}
