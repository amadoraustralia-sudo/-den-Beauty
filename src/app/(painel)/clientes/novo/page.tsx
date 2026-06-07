import FormCard from "@/components/FormCard";
import { createClient } from "@/lib/supabase/server";
import NovoClienteForm from "./NovoClienteForm";

export default async function NovoClientePage() {
  const supabase = await createClient();
  const { data: profissionais } = await supabase
    .from("profissionais").select("id, nome").eq("ativo", true).order("nome");

  return (
    <FormCard title="Novo cliente" subtitle="Preencha os dados do cliente" backHref="/clientes">
      <NovoClienteForm profissionais={profissionais ?? []} />
    </FormCard>
  );
}
