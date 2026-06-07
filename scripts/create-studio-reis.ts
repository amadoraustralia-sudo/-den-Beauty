/**
 * Script de setup — Studio Reis Beauty
 * Preencha as variáveis abaixo e rode:
 *   npx ts-node scripts/create-studio-reis.ts
 *
 * Pré-requisito: .env.local com SUPABASE_SERVICE_ROLE_KEY e NEXT_PUBLIC_SUPABASE_URL
 */

import { createClient } from "@supabase/supabase-js";

// ──────────────────────────────────────────────
//  DADOS DA GESTORA
// ──────────────────────────────────────────────
const GESTORA_EMAIL    = "maryenneisadorareis@icloud.com";
const GESTORA_SENHA    = "StudioRB";             // trocar após 1º acesso
const GESTORA_NOME     = "Isadora Reis";
const GESTORA_TELEFONE = "(34)99981-4613";
// ──────────────────────────────────────────────

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log("🔧 Criando conta Studio Reis Beauty...\n");

  // 1. Criar usuário no Auth
  let userId: string;
  const { data: created, error: signUpErr } = await supabase.auth.admin.createUser({
    email:           GESTORA_EMAIL,
    password:        GESTORA_SENHA,
    email_confirm:   true,
    user_metadata: {
      nome:      GESTORA_NOME,
      telefone:  GESTORA_TELEFONE,
      role:      "admin",
    },
  });

  if (signUpErr?.message?.includes("already been registered")) {
    console.log("⚠️  Usuário já existe — buscando ID...");
    const { data: list } = await supabase.auth.admin.listUsers();
    const existing = list?.users?.find((u) => u.email === GESTORA_EMAIL);
    if (!existing) { console.error("❌ Usuário não encontrado."); process.exit(1); }
    userId = existing.id;
  } else if (signUpErr || !created?.user) {
    console.error("❌ Erro ao criar usuário:", signUpErr?.message); process.exit(1);
  } else {
    userId = created.user.id;
    console.log("✅ Usuário criado:", userId);
  }

  // 2. Criar perfil
  await supabase.from("profiles").upsert({
    id:   userId,
    nome: GESTORA_NOME,
    role: "admin",
    ativo: true,
  }, { onConflict: "id" });
  console.log("✅ Perfil criado");

  // 3. Criar configuracoes do salão
  const { data: existingConfig } = await supabase
    .from("configuracoes")
    .select("id, slug")
    .eq("owner_user_id", userId)
    .single();

  let salaoId: string;
  let slug: string;

  if (existingConfig) {
    salaoId = existingConfig.id;
    slug    = existingConfig.slug;
    console.log("⚠️  Salão já existe — slug:", slug);
  } else {
    slug = "studio-reis-beauty";

    const { data: salon, error: salonErr } = await supabase
      .from("configuracoes")
      .insert({
        nome_estabelecimento:      "Studio Reis Beauty",
        slug,
        owner_user_id:             userId,
        telefone:                  GESTORA_TELEFONE,
        email:                     GESTORA_EMAIL,
        endereco:                  "Rua Pereira Guimarães, 596",
        horario_abertura:          "08:00:00",
        horario_fechamento:        "20:00:00",
        dias_funcionamento:        ["seg", "ter", "qua", "qui", "sex", "sab"],
        intervalo_agendamento:     10,
        antecedencia_minima_horas: 2,
        cancelamento_horas:        24,
      })
      .select("id")
      .single();

    if (salonErr || !salon) {
      console.error("❌ Erro ao criar salão:", salonErr?.message); process.exit(1);
    }
    salaoId = salon.id;
    console.log("✅ Salão criado — id:", salaoId, "slug:", slug);
  }

  // 4. Vincular salão ao profile
  await supabase.from("profiles").update({ salao_id: salaoId }).eq("id", userId);
  console.log("✅ Profile vinculado ao salão");

  // 5. Inserir serviços
  const servicos = [
    { nome: "Design Personalizado",        categoria: "Sobrancelha", duracao_min:  40, preco: 40  },
    { nome: "Design e Henna",              categoria: "Sobrancelha", duracao_min:  70, preco: 50  },
    { nome: "Design e Tintura",            categoria: "Sobrancelha", duracao_min:  70, preco: 60  },
    { nome: "Brow Lamination",             categoria: "Sobrancelha", duracao_min:  70, preco: 120 },
    { nome: "Design e Reconstrução",       categoria: "Sobrancelha", duracao_min:  60, preco: 60  },
    { nome: "Botox de Sobrancelhas",       categoria: "Sobrancelha", duracao_min:  60, preco: 60  },
    { nome: "Buço (epilação com cera)",    categoria: "Depilação",   duracao_min:  10, preco: 15  },
    { nome: "Limpeza de Pele Glow Power",  categoria: "Estética",    duracao_min: 120, preco: 120 },
    { nome: "Extensão de Cílios",          categoria: "Cílios",      duracao_min: 120, preco: 120 },
    { nome: "Manutenção de Cílios",        categoria: "Cílios",      duracao_min:  60, preco: 70  },
    { nome: "Lash Lifting",                categoria: "Cílios",      duracao_min:  80, preco: 0   },
  ].map((s) => ({ ...s, salao_id: salaoId, ativo: true }));

  const { error: servicosErr } = await supabase.from("servicos").insert(servicos);
  if (servicosErr) {
    console.error("⚠️  Erro ao inserir serviços:", servicosErr.message);
  } else {
    console.log(`✅ ${servicos.length} serviços cadastrados`);
  }

  // 6. Inserir profissional (a própria gestora)
  const { error: profErr } = await supabase.from("profissionais").insert({
    nome:               GESTORA_NOME,
    cargo:              "Gestora",
    email:              GESTORA_EMAIL,
    telefone:           GESTORA_TELEFONE,
    percentual_comissao: null,
    periodo_fechamento: "mensal",
    especialidades:     [],
    salao_id:           salaoId,
    ativo:              true,
  });
  if (profErr) {
    console.error("⚠️  Erro ao inserir profissional:", profErr.message);
  } else {
    console.log("✅ Profissional cadastrada:", GESTORA_NOME);
  }

  // ──────────────────────────────────────────
  console.log("\n🎉 Studio Reis Beauty configurado!");
  console.log("─────────────────────────────────────────");
  console.log(`  Login gestora : ${GESTORA_EMAIL}`);
  console.log(`  Senha         : ${GESTORA_SENHA}`);
  console.log(`  Página pública: /{BASE_URL}/${slug}`);
  console.log(`  Link cadastro : /{BASE_URL}/${slug}/cadastro`);
  console.log("─────────────────────────────────────────");
  console.log("\nPróximos passos:");
  console.log("  1. Acesse o dashboard em /login");
  console.log("  2. Vá em Serviços → Adicionar os serviços do salão");
  console.log("  3. Vá em Profissionais → Cadastrar as profissionais");
  console.log("  4. Compartilhe o link de cadastro com as clientes");
}

main().catch(console.error);
