# Crescer Estratégico

PDV + gestão para pamonharia/loja de comida. Sistema **em uso real** (dados de produção no Turso).

> O repositório/pacote ainda se chama `pamonharia-app`; o produto é **Crescer Estratégico**.

## Funcionalidades

- **PDV** — frente de caixa, baixa estoque automática, carrega comanda via `?comanda=<id>`. Código rápido aceita `código` ou `peso*código` (ex: `0,870*2`).
- **Comandas** — pedidos abertos por mesa/cliente; **Colocar na comanda** (mantém aberta) ou **Enviar pro caixa**.
- **Caixa** — abertura, sangria/suprimento e fechamento cego.
- **Produtos** — revenda ou fabricação própria (ficha técnica → custo), precificação por markup, categoria obrigatória.
- **Usuários** — admin vê tudo; usuário comum vê só os módulos liberados (permissões por módulo).
- **Categorias, Estoque, CMV, Financeiro, Produção, Clientes, Configurações.**
- **IA** — assistente de negócio com contexto da loja (provider configurável).

## Stack

Next.js 16 (App Router) · React 19 · TypeScript strict · Prisma 7 (LibSQL/Turso) · NextAuth 5 · Tailwind CSS 4 · Radix UI · Recharts · Lucide · Vercel AI SDK.

## Rodando localmente

```bash
npm install
npx prisma migrate dev      # aplica migrações no dev.db local
npx prisma db seed          # dados demo
npm run dev                 # http://localhost:3000
```

Login demo (seed): `admin@pamonharia.com` / `admin123`.

## Comandos

```bash
npm run build    # prisma generate && next build  (portão principal: type-check estrito)
npm run lint
npm run start    # produção local

npx prisma migrate dev --name <nome>   # cria + aplica migração no dev
npx prisma studio                      # inspecionar o banco
```

## UI / Design system

Cores via **tokens semânticos** em `src/app/globals.css` (claro/escuro) — dark mode é automático, não use `gray-*`/`orange-*` direto. Componentes reutilizáveis em `src/components/ui/`. Ícones com `lucide-react`. App é um **PWA instalável**. Detalhes em [`AGENTS.md`](./AGENTS.md).

## Deploy

Produção em **Vercel + Turso** (auto-deploy no push para `main`). URL pública: https://pamonharia-app-ten.vercel.app

⚠️ **Migrations não rodam no build.** Após `prisma migrate dev`, aplique cada uma no Turso manualmente:

```bash
turso db shell pamonharia < prisma/migrations/<nome>/migration.sql
```

Veja [`AGENTS.md`](./AGENTS.md) para arquitetura, convenções e detalhes de deploy.
