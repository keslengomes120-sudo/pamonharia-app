# Atualizações — Cliente João

> Coleta: Zumi 📱 → Documentação: Zuri 🦎 → Desenvolvimento: Lumi 🤖

## Cliente: João Erley
**Projeto:** Crescer Estratégico (PDV + gestão para pamonharia/restaurante)
**Status:** Em produção real (Vercel + Turso)

---

## Melhorias já implementadas (anteriormente)
- [x] Renomear → Sistema Crescer Estratégico
- [x] Cadastro de produtos (Revenda + Fabricação Própria)
- [x] Precificação com markup automático (70% padrão, editável)
- [x] Módulo de Comandas
- [x] Caixa Cego (abertura, sangria, suprimento, fechamento)
- [x] Dashboard (apenas admin)

---

## 🆕 Novas solicitações do João

### 🛒 PDV
- [x] **Produto por peso no PDV** — campo de código rápido aceita `peso*codigo` (ex: `0,870*2` = 0,870 kg do produto código 2), igual ao da comanda. Itens em kg mostram o peso no carrinho.

### 👥 Colaboradores / Usuários
- [x] **Permissões granulares por usuário** — admin vê tudo; usuário comum (`role` ≠ admin) vê **só os módulos que o admin liberar**. No cadastro do usuário há um checklist de módulos (Produtos, Estoque, Financeiro, etc.). Salvo em `User.permissions` (JSON de hrefs); a Sidebar/Drawer filtram por `visibleNav`.

### 🌽 Produtos
- [x] **Categoria obrigatória** — o formulário de produto agora tem o seletor de categoria e **bloqueia o salvamento** sem categoria selecionada.

### 📋 Comandas → 💰 Fluxo Caixa
- [x] **"Colocar na comanda"** — salva os itens e volta para a lista de comandas (comanda segue aberta).
- [x] **"Enviar pro caixa"** — vai direto para o PDV com os itens carregados para finalizar a venda.

---

## ⚠️ Migração de produção (Turso)
A feature de permissões adicionou a coluna `User.permissions`. Aplicar no Turso antes de usar em produção:

```bash
turso db shell pamonharia < prisma/migrations/20260612233852_add_user_permissions/migration.sql
```

O SQL inclui backfill: usuários não-admin existentes recebem o acesso padrão (`/pdv`, `/comandas`, `/caixa`, `/producao`, `/ia`) para não perderem acesso.

---

## Time
- **Zdark** 👑 — dono
- **Zumi** 📱 — atendimento e levantamento
- **Zuri** 🦎 — documentação e especificação
- **Lumi** 🤖 — programação e implementação
