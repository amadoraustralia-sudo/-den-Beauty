# Relatório de Auditoria de Segurança — Eden Beauty
**Data:** 2026-06-10  
**Auditor:** Eden Security Guardian (Claude Code)  
**Escopo:** Codebase completo + migrations (`src/`, `supabase/migrations/`)  
**Produto:** Eden Beauty — SaaS multi-tenant de gestão de salão de beleza  

---

## Resumo Executivo

Após as correções das sessões anteriores (RLS de storage, session ordering no cadastro do portal, profissionais_public_read, REVOKE anon em register_portal_client, indexes de performance), o Eden Beauty está em boa postura de segurança. **Nenhum achado crítico ou alto foi identificado nesta auditoria.**

Os achados restantes são todos de **médio ou baixo risco**: padrões de proteção de rota frágeis que hoje funcionam mas quebram na primeira page nova mal escrita, e oportunidades de endurecimento sem exploração trivial.

| Severidade | Quantidade |
|------------|-----------|
| 🔴 Crítico | 0 |
| 🟠 Alto    | 0 |
| 🟡 Médio   | 3 |
| ⚪ Baixo    | 4 |

**O que resolver antes de produção com mais clientes:** itens M1 e M2 (proteção de rotas). O restante pode entrar no próximo sprint.

---

## Achados

### 🟡 M1 — Rota `/minha-conta` sem cobertura no middleware

```
Onde:     src/proxy.ts (ADMIN_ROUTES / PORTAL_PROTECTED)
          src/app/(cliente)/layout.tsx
O que é:  O middleware protege ADMIN_ROUTES e PORTAL_PROTECTED, mas /minha-conta
          não está em nenhuma das duas listas. A (cliente)/layout.tsx não tem
          nenhum if (!user) redirect(). A proteção vem SOMENTE das páginas
          individuais (minha-conta/page.tsx e actions.ts verificam auth), mas
          o padrão é frágil: qualquer page nova que esqueça o check fica exposta
          sem nenhuma rede de segurança.
Impacto:  Uma page adicionada sob /minha-conta sem verificação de auth seria
          acessível por qualquer visitante não autenticado. Hoje não há vazamento
          porque cada page existente verifica individualmente.
Correção: Duas mudanças complementares:

  1. Adicionar /minha-conta ao middleware (src/proxy.ts):
     const ADMIN_ROUTES = [
       "/dashboard", "/agenda", "/clientes", "/agendamentos",
       "/profissionais", "/servicos", "/financeiro", "/relatorios",
       "/configuracoes", "/minha-conta",  // ← adicionar
     ];

  2. Adicionar verificação de auth na (cliente)/layout.tsx como failsafe:
     import { createClient } from "@/lib/supabase/server";
     import { redirect } from "next/navigation";
     
     export default async function ClienteLayout({ children }) {
       const supabase = await createClient();
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) redirect("/login");  // ← failsafe
       return (
         <div className="min-h-screen" ...>
           <ClienteNav />
           <main ...>{children}</main>
         </div>
       );
     }

Validar:  Acesse /minha-conta sem estar logado — deve redirecionar para /login
          tanto antes quanto depois de adicionar qualquer nova page.
```

---

### 🟡 M2 — Layout do painel admin sem failsafe de auth redirect

```
Onde:     src/app/(painel)/layout.tsx
O que é:  O middleware protege as rotas listadas em ADMIN_ROUTES, mas se uma
          nova rota admin for criada (ex: /comissoes, /campanhas) sem ser
          adicionada à lista, o layout não redireciona para /login — ele chama
          getSalon() e, se retornar null (usuário não autenticado), renderiza
          a página sem bloquear.
Impacto:  Nova rota admin acessível sem autenticação até o desenvolvedor lembrar
          de atualizar o ADMIN_ROUTES. Não há vazamento hoje porque todas as
          9 rotas existentes estão na lista.
Correção: Adicionar um guard de auth no (painel)/layout.tsx como segunda linha
          de defesa. Ler o arquivo atual e adicionar no início:

          const supabase = await createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) redirect("/login");

          Isso garante que qualquer rota sob (painel) — mesmo as não listadas
          no middleware — bloqueie usuários não autenticados.
Validar:  Crie temporariamente uma rota /test-sem-middleware sob (painel) e
          acesse sem login — deve redirecionar para /login.
```

---

### 🟡 M3 — `cancelarAgendamento` usa email em vez de `auth_user_id` para lookup

```
Onde:     src/app/(cliente)/minha-conta/agendamentos/[id]/cancelar/actions.ts:18-19
O que é:  O lookup de cliente usa .eq("email", user.email!) em vez de
          .eq("auth_user_id", user.id). O email pode ser duplicado entre
          clientes de salões diferentes (a tabela clientes não tem unique em email),
          o que faz .single() retornar erro e o usuário ser redirecionado sem
          conseguir cancelar — ou, em edge case, encontrar o cliente errado.
Impacto:  Usuário legítimo não consegue cancelar agendamento se o email estiver
          duplicado em outro salão. Não há risco de dados cruzados porque o
          cancelamento posterior usa .eq("cliente_id", cliente.id), mas o lookup
          é frágil.
Correção: Substituir lookup por auth_user_id:

          // ANTES
          const { data: cliente } = await supabase
            .from("clientes")
            .select("id")
            .eq("email", user.email!)
            .single();

          // DEPOIS
          const { data: cliente } = await supabase
            .from("clientes")
            .select("id")
            .eq("auth_user_id", user.id)
            .maybeSingle();  // maybeSingle em vez de single (não joga erro se null)

Validar:  Testar cancelamento com usuário que tem auth_user_id preenchido na
          tabela clientes. Confirmar que o campo auth_user_id é preenchido no
          cadastro via register_portal_client RPC.
```

---

### ⚪ B1 — `getSalonBySlug` retorna `select("*")` incluindo `owner_user_id`

```
Onde:     src/lib/supabase/salon.ts:49
O que é:  A função getSalonBySlug() faz select("*") na tabela configuracoes,
          que inclui owner_user_id (UUID do dono do salão). A função está definida
          mas não é importada em nenhum lugar do código ainda — quando for usada
          em páginas do portal, owner_user_id chegará ao caller desnecessariamente.
Impacto:  Exposição do UUID do dono do salão a código que não precisa dele.
          Baixo risco isolado, mas vaza dado desnecessário em conformidade com
          LGPD (minimização).
Correção: Alterar o select para retornar apenas campos necessários:

          const { data } = await supabase
            .from("configuracoes")
            .select("id, slug, nome_estabelecimento, logo_url, telefone, email, endereco, horario_abertura, horario_fechamento, dias_funcionamento, horarios_semana, intervalo_agendamento, antecedencia_minima_horas, cancelamento_horas")
            .eq("slug", slug)
            .single();

Validar:  Confirmar que nenhum caller de getSalonBySlug usa owner_user_id.
```

---

### ⚪ B2 — CSP com `unsafe-inline` e `unsafe-eval` em `script-src`

```
Onde:     next.config.ts:22
O que é:  A Content-Security-Policy inclui 'unsafe-eval' e 'unsafe-inline'
          no script-src. O comentário no código já reconhece isso como provisório.
          Esses diretivos reduzem significativamente a proteção contra XSS —
          qualquer script inline ou eval() executará sem bloqueio.
Impacto:  Ataca XSS fica mais fácil se algum input não sanitizado chegar a uma
          renderização HTML. O risco prático depende de existir um vetor de XSS
          no código — não identificado nesta auditoria.
Correção: Substituir unsafe-inline por nonces (Next.js App Router suporta via
          middleware). unsafe-eval geralmente pode ser removido em produção com
          App Router. Implementação incremental:
          
          1. Remover 'unsafe-eval' primeiro (quebra menos coisas).
          2. Migrar para nonces com next/headers para 'unsafe-inline'.
          
          Referência: https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy

Validar:  Rodar a aplicação sem unsafe-eval e monitorar erros no console do browser.
```

---

### ⚪ B3 — Sem rate limit no endpoint de criação de conta de salão

```
Onde:     src/app/cadastro/actions.ts — completarCadastroSalao()
O que é:  Não há rate limit na Server Action de cadastro de novo salão, permitindo
          que um atacante crie centenas de contas de teste automaticamente.
          O endpoint de /login tem rate limit (src/lib/rate-limit.ts), mas o
          cadastro não.
Impacto:  Possível criação massiva de contas fictícias, spam no banco de dados,
          custo de email de confirmação. Baixo impacto se email confirmation
          estiver ativo (cada conta precisa de um email real).
Correção: Aplicar o mesmo rate limiter existente:

          import { rateLimit } from "@/lib/rate-limit";
          import { headers } from "next/headers";

          export async function completarCadastroSalao(nome: string, telefone: string) {
            const hdrs = await headers();
            const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";
            const rl = rateLimit(`cadastro-salao:${ip}`, 5, 3600_000); // 5 por hora
            if (!rl.ok) return { error: "Muitas tentativas. Tente novamente mais tarde." };
            // ... resto da lógica
          }

Validar:  Testar 6 cadastros em sequência do mesmo IP — o 6º deve ser bloqueado.
```

---

### ⚪ B4 — Ausência de `.env.example` no repositório

```
Onde:     raiz do projeto
O que é:  Não existe .env.example documentando quais variáveis de ambiente são
          necessárias. O onboarding de um novo dev ou a subida de um ambiente de
          staging depende de conhecimento informal.
Impacto:  Risco operacional: novo ambiente configurado sem alguma variável
          crítica (ex: SUPABASE_SERVICE_ROLE_KEY ausente) pode gerar comportamento
          inesperado difícil de debugar. Também aumenta chance de alguém commitar
          um .env real por não saber o que é público.
Correção: Criar .env.example na raiz:

          # Supabase — público (vai pro client bundle)
          NEXT_PUBLIC_SUPABASE_URL=
          NEXT_PUBLIC_SUPABASE_ANON_KEY=
          
          # Supabase — NUNCA expor no client
          # SUPABASE_SERVICE_ROLE_KEY=   # adicionar se/quando precisar de bypass RLS no servidor
          
          # App
          NEXT_PUBLIC_APP_URL=http://localhost:3000

Validar:  Confirmar que .env está no .gitignore (já deve estar), e que .env.example
          está commitado sem valores reais.
```

---

## O que está bem (não tocar)

- **`admin/layout.tsx`** — verifica `user` + `profile.role === "super_admin"` e redireciona. ✓
- **`admin/saloes/actions.ts`** — `assertSuperAdmin()` em todas as Server Actions. ✓
- **`api/financeiro/export/route.ts`** — verifica `getSalaoId()` e retorna 401 se null. ✓
- **`agendar/(portal)/layout.tsx`** — verifica auth + bloqueia admin/super_admin de entrar no portal. ✓
- **`criarLancamento`** — valida `tipo` contra enum, `data` contra regex, `valor` > 0. ✓
- **`atualizarCliente`** — escopa por `salao_id` do admin logado (sem IDOR cross-tenant). ✓
- **`rate-limit.ts`** — fallback IP `127.0.0.1` com warn em dev. ✓
- **`login/actions.ts`** — open redirect bloqueado (só permite paths relativos sem `//`). ✓
- **`next.config.ts`** — security headers completos: HSTS, X-Frame-Options DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP/CORP. ✓
- **Migrations de segurança** — REVOKE anon em register_portal_client, storage folder-scoped, profissionais anon landing, indexes de FK. ✓

---

## Próximos passos recomendados (por prioridade)

1. **[Sprint atual]** Corrigir M1 + M2 — adicionar `/minha-conta` ao ADMIN_ROUTES e failsafe ao `(painel)/layout.tsx`
2. **[Sprint atual]** Corrigir M3 — mudar `cancelarAgendamento` para usar `auth_user_id`
3. **[Próximo sprint]** B4 — criar `.env.example`
4. **[Próximo sprint]** B1 — narrowar `getSalonBySlug` select antes de usá-la em produção
5. **[Backlog]** B2 — remover `unsafe-eval` do CSP e migrar para nonces
6. **[Backlog]** B3 — rate limit no cadastro de salão

---

*Relatório gerado por Eden Security Guardian — revisão defensiva de código, não teste ativo de invasão.*  
*Ambiente de produção não foi acessado. Todos os achados são baseados em leitura estática do código-fonte.*
