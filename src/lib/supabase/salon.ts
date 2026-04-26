import { createClient } from "./server";

/** Retorna a configuração completa do salão do admin logado */
export async function getSalon() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("configuracoes")
    .select("*")
    .eq("owner_user_id", user.id)
    .single();

  return data ?? null;
}

/** Retorna apenas o ID do salão do admin logado.
 *  Também sincroniza profiles.salao_id se necessário, para que as políticas
 *  RLS (get_my_salao_id) funcionem corretamente em inserts/updates. */
export async function getSalaoId(): Promise<string | null> {
  const salon = await getSalon();
  if (!salon?.id) return null;

  // Garante que profiles.salao_id está sincronizado com o salão encontrado
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("salao_id")
      .eq("id", user.id)
      .single();

    if (profile && profile.salao_id !== salon.id) {
      await supabase
        .from("profiles")
        .update({ salao_id: salon.id })
        .eq("id", user.id);
    }
  }

  return salon.id;
}

/** Busca um salão pelo slug (para o portal do cliente) */
export async function getSalonBySlug(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("configuracoes")
    .select("*")
    .eq("slug", slug)
    .single();
  return data ?? null;
}

/** Gera um slug único a partir do nome do estabelecimento */
export function generateSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 50);
}
