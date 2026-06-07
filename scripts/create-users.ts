import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidos no .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const users = [
  {
    email: "edenteam777@gmail.com",
    password: "tugun445",
    nome: "Eden Admin",
    role: "super_admin" as const,
  },
  {
    email: "gestora.teste@edenbeauty.com",
    password: "Gestora2025!",
    nome: "Gestora Teste",
    role: "admin" as const,
  },
  {
    email: "cliente.teste@edenbeauty.com",
    password: "Cliente2025!",
    nome: "Cliente Teste",
    role: "cliente" as const,
  },
];

async function createUsers() {
  console.log("🚀 Criando usuários via Admin API...\n");

  for (const user of users) {
    // Criar no auth
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { nome: user.nome },
    });

    if (error) {
      if (error.message.includes("already been registered")) {
        console.log(`⚠️  ${user.email} já existe — atualizando senha...`);
        const { data: list } = await supabase.auth.admin.listUsers();
        const existing = list?.users?.find((u) => u.email === user.email);
        if (existing) {
          await supabase.auth.admin.updateUserById(existing.id, {
            password: user.password,
            email_confirm: true,
          });
          // Upsert profile
          await supabase.from("profiles").upsert(
            { id: existing.id, nome: user.nome, role: user.role, ativo: true },
            { onConflict: "id" }
          );
          console.log(`✅ ${user.email} atualizado (role: ${user.role})`);
        }
        continue;
      }
      console.error(`❌ Erro ao criar ${user.email}:`, error.message);
      continue;
    }

    const userId = data.user?.id;
    if (!userId) continue;

    // Inserir profile
    const { error: profileError } = await supabase.from("profiles").upsert(
      { id: userId, nome: user.nome, role: user.role, ativo: true },
      { onConflict: "id" }
    );

    if (profileError) {
      console.error(`❌ Profile para ${user.email}:`, profileError.message);
    } else {
      console.log(`✅ ${user.email} criado (id: ${userId}, role: ${user.role})`);
    }
  }

  console.log("\n✅ Concluído! Verifique em Supabase → Authentication → Users");
}

createUsers();
