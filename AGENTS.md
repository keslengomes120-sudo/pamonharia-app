# Crescer Estratégico

Nome do produto: **Crescer Estratégico** (o repositório/pacote ainda se chama `pamonharia-app`). Sistema de gestão para uma pamonharia **em uso real**. Não é um exercício — há dados de produção no Turso. Priorize estabilidade: não quebre dados, não rode migração destrutiva sem avaliar impacto, prefira mudanças incrementais e reversíveis.

## O que é

PDV + gestão para uma loja de pamonha/comida. Funcionalidades:

- **PDV** (`/pdv`) — frente de caixa, registra vendas e baixa estoque automaticamente. Aceita carregar uma comanda via `?comanda=<id>`.
- **Comandas** (`/comandas`) — pedidos abertos por mesa/cliente; ao enviar pro caixa, abre o PDV já com os itens. A venda finaliza a comanda.
- **Caixa** (`/caixa`) — abertura (fundo de troco), sangria/suprimento e fechamento cego (operador conta os valores por método; o sistema confere com o registrado e mostra a diferença).
- **Produtos** (`/produtos`) — dois tipos: **revenda** (preço de compra + venda) e **fabricação própria** (ficha técnica de insumos → custo). Precificação automática por markup (botão "Sugerir preço").
- **Categorias** (`/categorias`) — grupos coloridos de produtos.
- **Estoque** (`/estoque`) — insumos, saldo, mínimo e movimentações (entrada/saída/perda/ajuste).
- **CMV** (`/cmv`) — análise de Custo de Mercadoria Vendida por período/produto.
- **Financeiro** (`/financeiro`) — receita, despesas, lucro líquido, formas de pagamento.
- **Produção** (`/producao`) — simulação de custo por quantidade.
- **Clientes** (`/clientes`) — cadastro e pontos.
- **IA** (`/ia`) — assistente de negócio com contexto da loja; provider configurável.
- **Usuários** (`/usuarios`) — gestão de acesso (`admin` / `operador`).
- **Configurações** (`/configuracoes`) — escolha de provider/modelo de IA por loja.

## Stack

- **Next.js 16.2.9** (App Router) + **React 19** + **TypeScript** (strict).
- **Prisma 7** com adapter **LibSQL** — SQLite local (`file:./dev.db`) / **Turso** em produção.
- **NextAuth 5 (beta)** — Credentials provider (email/senha, bcrypt), sessão JWT.
- **Tailwind CSS 4** (via `@tailwindcss/postcss`) + primitivos **Radix UI** + **Recharts**.
- **Vercel AI SDK** com múltiplos providers (Google, Anthropic, OpenAI, Mistral, DeepSeek, Ollama).
- React Hook Form + Zod, Zustand, Sonner (toasts), next-themes (dark/light), Lucide (ícones).

## Comandos

```bash
npm run dev      # dev server
npm run build    # prisma generate && next build  (sempre gera o client antes)
npm run start    # produção local
npm run lint     # eslint

npx prisma migrate dev --name <nome>   # cria + aplica migração no dev
npx prisma generate                    # regenera o client após mexer no schema
npx prisma studio                      # inspecionar o banco
npx prisma db seed                     # popula dados demo (tsx prisma/seed.ts)
```

Login demo (seed): `admin@pamonharia.com` / `admin123`.

## Arquitetura

- **Rotas protegidas** ficam sob o grupo `src/app/(app)/` — o layout desse grupo faz o guard de auth e renderiza Sidebar (desktop) / MobileHeader + MobileDrawer (mobile). `/login` fica fora do grupo.
- **Páginas** são Server Components que buscam dados direto (ex: dashboard usa `lib/cmv`); interações ricas ficam em Client Components (`"use client"`).
- **API REST** em `src/app/api/*/route.ts`. Toda rota valida `auth()`; rotas admin checam `role === "admin"`. `storeId` vem da sessão (`session.user.storeId`) — multi-tenant por loja.
- **lib/**: `auth.ts` (config NextAuth), `db.ts` (Prisma singleton + adapter LibSQL), `utils.ts` (formatação pt-BR, datas, `cn`), `cmv.ts` (custo de produto, CMV por período/produto), `ai.ts` (init do modelo, contexto da loja, `askAi`), `ai-providers.ts` (catálogo de providers/modelos).
- **Estrutura de pastas é por responsabilidade.** Componentes em `src/components/{layout,dashboard,providers}`. Não crie pastas vazias "para depois".

## Banco de dados (cuidado — produto em uso)

- Sempre que mexer no `schema.prisma`: `npx prisma migrate dev --name <descritivo>` e confira o SQL gerado em `prisma/migrations/` **antes** de considerar pronto.
- Em produção (Turso) a migração precisa ser aplicada contra o banco remoto — não assuma que `migrate dev` (que roda no SQLite local) já resolveu produção.
- Exclusão de produto é **soft delete** (`active = false`); não apague registros com histórico de vendas.
- `storeId` é obrigatório em quase tudo — sempre derive da sessão, nunca confie em valor vindo do client.

## Convenções de código

- Código, nomes e comentários em **inglês**. Textos de UI em **português**.
- **Zero código morto**: sem imports/variáveis/funções não usados, sem blocos comentados, sem pastas vazias. Ao alterar algo, remova o que ficou obsoleto.
- Funções curtas, nomes descritivos, sem duplicação. Siga o estilo já existente nos arquivos vizinhos.
- Comentários só quando o "porquê" não é óbvio pelo código.
- Não adicione dependências novas sem avisar.

## Verificação (não há suíte de testes)

O projeto não tem testes automatizados. Para validar uma mudança, nesta ordem:

1. `npm run build` — roda `prisma generate` + type-check + build do Next. **É o portão principal**; o type-check estrito pega a maioria dos erros.
2. `npm run lint`.
3. Para mudanças de UI/fluxo (PDV, vendas, estoque): rode `npm run dev` e teste o caminho no navegador. Não diga que está pronto sem isso.

Nunca afirme "funcionando" sem ter rodado o build de fato.

## Deploy

- **Produção: Vercel + Turso.**
- Banco: Turso (`DATABASE_URL="libsql://..."` + `TURSO_AUTH_TOKEN`). Em dev é `file:./dev.db`.
- Env vars necessárias (ver `.env.example`): `DATABASE_URL`, `TURSO_AUTH_TOKEN` (prod), `NEXTAUTH_SECRET`, `NEXTAUTH_URL`.
- Build na Vercel já roda `prisma generate` via o script `build`.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
