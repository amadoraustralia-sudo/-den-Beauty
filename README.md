# Eden Beauty — Sistema de Salão de Beleza

Sistema de gestão para salões de beleza. Painel administrativo, portal do cliente, agendamentos e relatórios financeiros.

## Tecnologias

- **Frontend:** Next.js (TypeScript)
- **Backend / Banco:** Supabase (PostgreSQL)
- **Estilização:** Tailwind CSS

## Como começar

### Pré-requisitos

- Node.js 18+
- Conta no Supabase (ou instância local)

### Clonar e instalar

```bash
git clone https://github.com/amadoraustralia-sudo/-den-Beauty.git
cd -den-Beauty
npm install
```

### Configurar variáveis de ambiente

Copie o arquivo de exemplo e preencha com suas credenciais do Supabase:

```bash
cp .env.example .env.local
```

Edite `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui
```

### Rodar localmente

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

---

## Fluxo de trabalho (Git)

### Branches

| Branch | Propósito |
|--------|-----------|
| `master` | Produção — merge somente via PR aprovado |
| `develop` | Desenvolvimento — integração de features |
| `feature/*` | Nova funcionalidade |
| `fix/*` | Correção de bug |
| `docs/*` | Atualização de documentação |

### Convenção de nomes de branch

```
feature/nome-da-funcionalidade
fix/descricao-do-bug
docs/atualizacao-de-doc
```

### Formato de mensagem de commit

```
Descrição clara do que mudou
```

Exemplos:
- `Adiciona tela de agendamento para o cliente`
- `Corrige erro ao salvar serviços duplicados`
- `Atualiza README com instruções de instalação`

### Criar e enviar uma feature

```bash
git checkout develop
git pull origin develop
git checkout -b feature/minha-funcionalidade

# ... faça as alterações ...

git add .
git commit -m "Descrição do que foi feito"
git push origin feature/minha-funcionalidade
```

Depois abra um Pull Request de `feature/minha-funcionalidade` → `develop` no GitHub.

### Revisor padrão de PRs

- **@amadoraustralia-sudo** e **@edenteam777-cloud** revisam mutuamente todos os PRs.

---

## Colaboradores

- [@amadoraustralia-sudo](https://github.com/amadoraustralia-sudo)
- [@edenteam777-cloud](https://github.com/edenteam777-cloud)
