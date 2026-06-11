# 🏪 Pamonharia App — Planejamento Completo do Projeto

> **Líder técnico:** Lumi (PC) — responsável por código, arquitetura, banco, IA  
> **Suporte estratégico:** Zumi (celular) — ideias de negócio, UX, validação  
> **Dono do projeto:** Keslen / ZDark  
> **Cliente:** a confirmar (loja de pamonhas)  
> **Status:** ✅ Planejamento aprovado — aguardando OK do Keslen pra iniciar  
> **Data:** 11/06/2026  
> **Revisão:** 11/06/2026 (pós-discussão Lumi + Zumi)

---

## ✅ DECISÕES CONSOLIDADAS (Lumi + Zumi, 11/06/2026)

| Ponto | Decisão |
|-------|---------|
| **Stack frontend** | Next.js 14 + TypeScript + Tailwind puro (PDV) + shadcn/ui (admin) |
| **Banco** | SQLite no dev/MVP → PostgreSQL em produção (Neon/Supabase free) |
| **IA padrão** | Google Gemini Flash (grátis, nuvem) |
| **IA upgrade** | Claude Haiku (pago, melhor) |
| **Ollama** | Somente dev/teste — não funciona no deploy Vercel |
| **PDV mobile** | Botões ≥48px, touch-action:manipulation, fluxo máx 3 toques |
| **PWA offline** | ⏳ Fase 2 — depende se cliente tem sinal instável |
| **Módulo de Produção** | ✅ Incluído — campo `tipo_producao` no produto, tela de lote |
| **Preço** | R$ 1.000 implantação + R$ 89/mês |
| **Argumento venda** | "Economiza 2h de planilha/semana + vê lucro em tempo real" |

**⚠️ AGUARDANDO antes de iniciar código:**
- [ ] Keslen confirma OK pra começar
- [ ] Resposta do cliente sobre as 10 perguntas (seção 11)
- [ ] Confirmar: loja tem internet estável? (define urgência do PWA offline)
- [ ] Nome e identidade visual do app

---

## 1. VISÃO DO PRODUTO

Web app **completo e profissional** para gestão de loja de pamonhas. O objetivo é dar ao cliente uma visão clara do negócio — especialmente do **CMV (Custo da Mercadoria Vendida)** — com um PDV simples, controle de estoque inteligente, e uma **IA integrada** que entende o negócio todo e responde perguntas em linguagem natural.

### O que o cliente vai ganhar
- Saber exatamente quanto custa produzir cada pamonha
- Ver em tempo real se tá tendo lucro ou prejuízo
- Controlar o estoque de insumos sem planilha
- Ter uma IA que responde "qual meu produto mais lucrativo?" e "preciso comprar milho?"
- Dashboard limpo que abre no celular e no PC

---

## 2. MÓDULOS COMPLETOS

### 2.1 🥟 Produtos (Cardápio + Fichas Técnicas)

O coração do sistema. Cada produto tem uma **ficha técnica** que lista os insumos necessários para produzi-lo — isso é o que alimenta o CMV.

**Campos por produto:**
- Nome (ex: Pamonha Doce, Pamonha Salgada de Frango, Curau, Canjica)
- Categoria (Pamonha, Bebida, Sobremesa, Acompanhamento)
- Preço de venda (R$)
- Rendimento (ex: 1 receita = 10 unidades)
- Unidade de venda (Un, kg, L)
- Status (ativo/inativo)
- Foto

**Ficha Técnica (insumos por produto):**
- Lista de ingredientes com quantidade por unidade produzida
- Ex: Pamonha Doce = 0,08 kg de milho + 0,01 L de leite + 0,005 kg de açúcar + 1 palha
- Custo calculado automaticamente a partir do preço atual dos insumos
- Margem de contribuição calculada = Preço Venda − Custo Produção

---

### 2.2 📦 Estoque (Insumos)

Controle de matéria-prima, não de produtos finais.

**Campos por insumo:**
- Nome (Milho, Leite, Queijo, Manteiga, Açúcar, Sal, Palha de milho, etc.)
- Unidade (kg, L, un, pacote, caixa)
- Quantidade atual
- Estoque mínimo (abaixo disso = alerta)
- Preço de custo por unidade (atualizado na última compra)
- Fornecedor padrão
- Histórico de preço (pra comparar variação)

**Movimentações:**
- **Entrada:** compra de insumos (com nota fiscal opcional)
- **Saída automática:** ao registrar uma venda, baixa os insumos da ficha técnica do produto
- **Saída manual:** perdas, quebras, vencimento
- **Ajuste de inventário:** contagem física corrige o sistema

---

### 2.3 💰 PDV — Ponto de Venda

Interface rápida para registrar vendas. Pensada para funcionar no celular atrás do balcão.

**Fluxo de uma venda:**
1. Selecionar produtos (clique rápido nos cards do cardápio)
2. Ajustar quantidade
3. Aplicar desconto (opcional)
4. Selecionar forma de pagamento: Dinheiro / PIX / Cartão Débito / Cartão Crédito
5. Confirmar → gera baixa automática no estoque + registra CMV da venda

**Funcionalidades extras:**
- Troco (para pagamento em dinheiro)
- Venda rápida (sem identificar o cliente)
- Venda com cliente (busca ou cadastra na hora)
- Cancelar venda (com motivo + estorno de estoque)
- Cupom simples (texto para imprimir ou WhatsApp)

---

### 2.4 📊 CMV — Custo da Mercadoria Vendida

**O diferencial principal do sistema.** CMV é o índice que mostra quanto do faturamento foi consumido em custo de produção.

#### Fórmula base:
```
CMV (%) = (Custo Total Produzido / Receita Total) × 100
```

#### Fórmula expandida (com variação de estoque):
```
CMV = Estoque Inicial + Compras do Período - Estoque Final
CMV (%) = CMV / Receita × 100
```

#### Benchmarks para alimentos:
| Tipo de negócio | CMV ideal |
|----------------|-----------|
| Lanchonete/fast food | 25% – 35% |
| Restaurante | 28% – 38% |
| Padaria/salgaderia | 25% – 35% |
| **Meta sugerida pro cliente** | **≤ 30%** |

#### O que o módulo mostra:
- **CMV por produto:** qual pamonha mais cara de fazer vs. o preço que vende
- **CMV do dia / semana / mês / ano**
- **Gráfico de evolução** (linha, mês a mês)
- **Alerta automático:** se CMV ultrapassar a meta configurada, exibe alerta no dashboard
- **Margem de contribuição por produto** = Preço − Custo
- **Markup sugerido** = Custo × (1 + % markup desejado)
- **Break-even por produto** = Custo Fixo Rateado / Margem de Contribuição
- **Análise ABC de produtos:** A (mais lucrativos), B (médio), C (prejudicam ou empatam)

---

### 2.5 💵 Financeiro

**Receitas:**
- Venda de produtos (integrado com PDV)
- Outras receitas (catering, eventos, venda de insumos extra)

**Despesas:**
- Compra de insumos (integrado com entrada de estoque)
- Despesas fixas: aluguel, energia, funcionários, embalagem, gás
- Despesas variáveis: frete, manutenção, outros
- Impostos (% sobre faturamento)

**DRE Simplificado (Demonstrativo de Resultado):**
```
(+) Receita Bruta
(−) Impostos
(=) Receita Líquida
(−) CMV (Custo dos Insumos Vendidos)
(=) Lucro Bruto
(−) Despesas Operacionais (fixas + variáveis − insumos)
(=) EBITDA (Lucro antes de juros e depreciação)
(=) Lucro Líquido
```

**Fluxo de Caixa:**
- Entradas e saídas diárias
- Saldo atual
- Projeção dos próximos 30 dias (com base em média histórica)

---

### 2.6 👥 Clientes

- Cadastro: nome, telefone, data de nascimento (aniversário)
- Histórico de compras (o que comprou, quando, quanto gastou)
- Ticket médio por cliente
- Frequência de visita
- Ranking de melhores clientes
- (Fase 2) Programa de fidelidade: pontos por real gasto, resgata desconto

---

### 2.7 🏭 Fornecedores

- Cadastro: nome, CNPJ, telefone, email, prazo de entrega
- Produtos fornecidos
- Histórico de compras + preços praticados
- Comparador de preço: mesmo insumo, múltiplos fornecedores
- Pedido de compra: gera lista de necessidades baseado em estoque mínimo

---

### 2.8 📊 Relatórios

- **Vendas:** por período, por produto, por forma de pagamento, por funcionário
- **Estoque:** posição atual, giro por período, insumos próximos do mínimo
- **CMV:** evolução mensal, por produto, vs. meta
- **Financeiro:** DRE por período, fluxo de caixa, lucratividade
- **Clientes:** ranking, recência, frequência
- **Exportação:** PDF e Excel de qualquer relatório

---

### 2.9 🤖 IA Integrada — Assistente da Loja

**O grande diferencial competitivo do app.** Uma IA que conhece 100% dos dados da loja e responde em linguagem natural.

#### Exemplos de perguntas que a IA responde:
- "Qual meu CMV esse mês? Tô dentro da meta?"
- "Qual pamonha dá mais lucro?"
- "Qual produto tô tendo prejuízo?"
- "Preciso comprar milho essa semana?"
- "Quanto ganhei mês passado comparado com este mês?"
- "Me faz um resumo do negócio em texto"
- "Quantas pamonhas salgadas vendi na última semana?"
- "Se o preço do milho subir 20%, quanto sobe o CMV?"
- "Qual meu cliente que mais compra?"
- "Tô gastando demais em algum insumo?"

#### Arquitetura da IA:
```
Usuário faz pergunta
        ↓
Sistema gera contexto (dados relevantes do banco)
        ↓
Monta prompt: "Você é o assistente desta loja. Dados: {...}. Pergunta: {...}"
        ↓
Envia pra API (Claude 3 Haiku ou Gemini Flash — barato)
        ↓
IA responde baseada nos dados reais
        ↓
Exibe resposta no chat da interface
```

#### Contexto injetado no prompt:
- Resumo financeiro do dia/mês atual
- Top produtos por vendas e lucro
- CMV atual vs. meta
- Alertas de estoque
- Últimas 5 transações
- Configurações da loja (nome, metas)

#### Custo estimado da IA:
- Claude Haiku: ~$0.25/1M tokens → praticamente zero pra uso normal
- Gemini Flash: grátis até 1M req/mês
- Sugestão: começar com Gemini Flash (grátis), oferecer Claude como upgrade

---

### 2.10 🏭 Produção (Lotes)
> ✅ Decidido por Zumi: necessário para quem produz em lote antes de vender

Pamonheiras geralmente produzem em lote de manhã (ex: 50 unidades) e vendem durante o dia. Sem esse módulo, o CMV fica distorcido.

**Fluxo correto com módulo de Produção:**
```
Produção (manhã): 50 pamonhas → baixa os insumos do estoque
Venda: -1 pamonha do estoque de produtos finalizados (não baixa insumo de novo)
```

**Sem o módulo (incorreto):**
```
Venda: -1 pamonha → tenta baixar insumos → mas eles já foram consumidos na produção
→ CMV errado, estoque negativo de insumos
```

**Como implementar (simples):**
- Campo no produto: `tipo_producao` = `unitario` ou `lote`
- Se `lote`: aparece botão "Registrar Produção" no estoque
  - Seleciona produto → informa quantidade produzida → sistema baixa os insumos (ficha técnica × qtd) e adiciona ao estoque de produtos prontos
- Se `unitario`: produção acontece na hora da venda (comportamento atual)

**API adicional:**
```
POST /production            → registrar produção de lote (baixa insumos, adiciona produto)
GET  /production            → histórico de produções
GET  /production/summary    → produzido vs. vendido por produto/período
```

---

### 2.11 ⚙️ Configurações e Usuários

**Configurações da Loja:**
- Nome, endereço, telefone, logo
- CNPJ (opcional)
- Meta de CMV (%)
- Markup padrão sugerido (%)
- Percentual de imposto (Simples Nacional, MEI, etc.)
- Horário de funcionamento
- Moeda (R$)

**Usuários e Permissões:**
| Perfil | O que pode fazer |
|--------|-----------------|
| Dono/Admin | Tudo — configurações, relatórios, usuários |
| Gerente | Vendas, estoque, produtos, relatórios |
| Operador/Balconista | Somente PDV e consulta de produtos |

---

## 3. BANCO DE DADOS — SCHEMA COMPLETO

### Tecnologia: PostgreSQL + Prisma ORM

```sql
-- USUÁRIOS
users (
  id          UUID PK
  name        TEXT
  email       TEXT UNIQUE
  password    TEXT (hash bcrypt)
  role        ENUM(admin, gerente, operador)
  store_id    UUID FK
  created_at  TIMESTAMP
  active      BOOLEAN
)

-- LOJA
stores (
  id              UUID PK
  name            TEXT
  cnpj            TEXT
  phone           TEXT
  address         TEXT
  logo_url        TEXT
  cmv_target      DECIMAL  -- meta de CMV em %
  default_markup  DECIMAL  -- markup padrão %
  tax_rate        DECIMAL  -- imposto %
  created_at      TIMESTAMP
)

-- CATEGORIAS
categories (
  id       UUID PK
  name     TEXT
  store_id UUID FK
)

-- INSUMOS (ESTOQUE)
ingredients (
  id            UUID PK
  store_id      UUID FK
  name          TEXT
  unit          TEXT  -- kg, L, un, pacote
  stock_qty     DECIMAL  -- quantidade atual
  min_stock     DECIMAL  -- estoque mínimo (alerta)
  cost_per_unit DECIMAL  -- preço atual por unidade
  supplier_id   UUID FK nullable
  created_at    TIMESTAMP
  updated_at    TIMESTAMP
)

-- MOVIMENTAÇÕES DE ESTOQUE
stock_movements (
  id             UUID PK
  ingredient_id  UUID FK
  type           ENUM(entrada, saida_venda, saida_perda, ajuste)
  qty            DECIMAL
  unit_cost      DECIMAL  -- custo no momento do movimento
  reference_id   UUID nullable  -- venda ou compra de origem
  note           TEXT
  created_at     TIMESTAMP
  user_id        UUID FK
)

-- PRODUTOS
products (
  id           UUID PK
  store_id     UUID FK
  category_id  UUID FK
  name         TEXT
  unit         TEXT  -- un, kg, L
  sale_price   DECIMAL
  image_url    TEXT
  active       BOOLEAN
  created_at   TIMESTAMP
  updated_at   TIMESTAMP
)

-- FICHA TÉCNICA (relação produto → insumos)
product_ingredients (
  id            UUID PK
  product_id    UUID FK
  ingredient_id UUID FK
  qty_per_unit  DECIMAL  -- quantidade do insumo por unidade do produto
  -- custo calculado: qty_per_unit × ingredients.cost_per_unit
)

-- CLIENTES
customers (
  id         UUID PK
  store_id   UUID FK
  name       TEXT
  phone      TEXT
  birthdate  DATE nullable
  notes      TEXT
  created_at TIMESTAMP
)

-- VENDAS (cabeçalho)
sales (
  id              UUID PK
  store_id        UUID FK
  customer_id     UUID FK nullable
  user_id         UUID FK  -- quem fez a venda
  total_amount    DECIMAL  -- total da venda
  total_cost      DECIMAL  -- custo total da venda (calculado)
  cmv_pct         DECIMAL  -- CMV da venda (%)
  discount        DECIMAL
  payment_method  ENUM(dinheiro, pix, debito, credito, misto)
  status          ENUM(concluida, cancelada)
  notes           TEXT
  created_at      TIMESTAMP
)

-- ITENS DA VENDA
sale_items (
  id          UUID PK
  sale_id     UUID FK
  product_id  UUID FK
  qty         DECIMAL
  unit_price  DECIMAL  -- preço no momento da venda
  unit_cost   DECIMAL  -- custo no momento da venda
  subtotal    DECIMAL
  cost_total  DECIMAL
)

-- DESPESAS
expenses (
  id          UUID PK
  store_id    UUID FK
  category    ENUM(aluguel, energia, funcionario, embalagem, gas, frete, outro)
  description TEXT
  amount      DECIMAL
  date        DATE
  recurrent   BOOLEAN
  created_at  TIMESTAMP
  user_id     UUID FK
)

-- FORNECEDORES
suppliers (
  id         UUID PK
  store_id   UUID FK
  name       TEXT
  cnpj       TEXT
  phone      TEXT
  email      TEXT
  created_at TIMESTAMP
)

-- CONVERSAS COM IA
ai_conversations (
  id         UUID PK
  store_id   UUID FK
  user_id    UUID FK
  message    TEXT
  response   TEXT
  tokens     INT
  created_at TIMESTAMP
)
```

---

## 4. API — ENDPOINTS COMPLETOS

### Base: `/api/v1/`

```
AUTH
POST   /auth/login           → retorna JWT
POST   /auth/logout
GET    /auth/me              → usuário atual

PRODUTOS
GET    /products             → lista (filtro: category, active)
POST   /products             → criar
GET    /products/:id
PUT    /products/:id
DELETE /products/:id
GET    /products/:id/cost    → custo calculado com insumos atuais
POST   /products/:id/ingredients → atualiza ficha técnica

INSUMOS / ESTOQUE
GET    /ingredients          → lista (filtro: low_stock)
POST   /ingredients          → criar
GET    /ingredients/:id
PUT    /ingredients/:id
POST   /ingredients/:id/movement → entrada/saída manual
GET    /ingredients/:id/history  → histórico de movimentos

VENDAS
GET    /sales                → lista (filtro: date, payment, status)
POST   /sales                → registrar venda (gera baixa estoque)
GET    /sales/:id
POST   /sales/:id/cancel     → cancela e estorna estoque
GET    /sales/summary        → totais por período (query: from, to)

CMV
GET    /cmv/summary          → CMV atual (query: from, to, granularity)
GET    /cmv/by-product       → CMV por produto
GET    /cmv/trend            → histórico mensal

FINANCEIRO
GET    /financial/dre        → DRE por período
GET    /financial/cashflow   → fluxo de caixa
POST   /expenses             → lançar despesa
GET    /expenses             → lista despesas (filtro: category, date)

CLIENTES
GET    /customers            → lista
POST   /customers            → criar
GET    /customers/:id
GET    /customers/:id/history → histórico de compras

FORNECEDORES
GET    /suppliers
POST   /suppliers
GET    /suppliers/:id
PUT    /suppliers/:id

RELATÓRIOS
GET    /reports/sales        → vendas por período (PDF ou JSON)
GET    /reports/stock        → posição de estoque (PDF ou JSON)
GET    /reports/cmv          → relatório de CMV (PDF ou JSON)
GET    /reports/dre          → DRE (PDF ou JSON)

IA
POST   /ai/chat              → pergunta → resposta (injeta contexto do banco)
GET    /ai/history           → histórico de conversas

CONFIGURAÇÕES
GET    /settings             → configurações da loja
PUT    /settings             → atualizar
GET    /users                → lista usuários (admin only)
POST   /users                → criar usuário
PUT    /users/:id
DELETE /users/:id
```

---

## 5. STACK TECNOLÓGICA DEFINITIVA
> ✅ Validado por Lumi + Zumi em 11/06/2026

```
FRONTEND + BACKEND (monolito Next.js)
├── Next.js 14 (App Router)           → routing, SSR, API routes
├── TypeScript                        → tipagem segura
├── Tailwind CSS puro (PDV)           → botões 48px+, touch-action:manipulation (sem delay 300ms)
├── shadcn/ui (admin/CRUDs)           → tabelas, modais, formulários — NÃO no PDV
├── Recharts                          → gráficos (linha, pizza, barra)
├── React Hook Form + Zod             → formulários com validação
├── Zustand                           → estado global simples
├── date-fns                          → manipulação de datas
└── next-auth                         → autenticação (JWT + sessão)

BANCO DE DADOS
├── SQLite (desenvolvimento/MVP)      → zero config, sem dependência externa
├── PostgreSQL (produção)             → Neon ou Supabase free tier
└── Prisma ORM                        → schema único pra ambos, troca via DATABASE_URL

IA
├── Vercel AI SDK                     → abstração pra múltiplos provedores
├── Google Gemini Flash (PADRÃO)      → grátis, roda na nuvem — funciona pro cliente
└── Claude Haiku (upgrade pago)       → upgrade se o cliente quiser mais capacidade
   OBS: Ollama local SOMENTE em dev/teste (não funciona quando app está na Vercel)

AUTENTICAÇÃO
└── next-auth + Prisma Adapter        → JWT + sessão no banco

RELATÓRIOS / EXPORT
├── @react-pdf/renderer               → geração de PDF no servidor
└── xlsx                              → exportação Excel

DEPLOY
├── Vercel                            → deploy automático (plano free funciona)
├── Neon / Supabase (free tier)       → PostgreSQL gerenciado grátis
└── Cloudinary (free tier)            → upload de imagens (logo, produtos)

PWA OFFLINE
└── ⏳ Fase 2 — service worker + IndexedDB + sync queue
   MVP depende de internet. Se cliente tiver sinal instável → priorizar Fase 2
```

---

## 6. ARQUITETURA DA IA — DETALHE TÉCNICO

### Fluxo completo de uma pergunta:

```
1. Usuário digita: "qual meu CMV esse mês?"

2. API /ai/chat recebe a pergunta

3. Sistema faz queries no banco:
   - Vendas do mês atual (total + custo)
   - CMV calculado
   - Top 5 produtos por lucro
   - Alertas de estoque baixo
   - Meta de CMV configurada
   - Últimos 3 meses para comparativo

4. Monta prompt estruturado:
   "Você é o assistente inteligente da [Nome da Loja], uma loja de pamonhas.
    Responda de forma direta, amigável e em português.
    
    DADOS ATUAIS DA LOJA:
    - Faturamento do mês: R$ 3.240,00
    - CMV do mês: R$ 972,00 (30%)
    - Meta de CMV: 28%
    - CMV está [ACIMA/DENTRO/ABAIXO] da meta
    - Produto mais lucrativo: Pamonha de Frango (margem 72%)
    - Produto com pior margem: Curau (margem 18%)
    - Insumos em alerta: Milho (3kg em estoque, mínimo 5kg)
    
    PERGUNTA DO USUÁRIO: 'qual meu CMV esse mês?'"

5. Envia pra Gemini/Claude

6. Resposta: 
   "Seu CMV esse mês está em 30% (R$ 972 de custo sobre R$ 3.240 faturados). 
    Sua meta é 28%, então você está 2 pontos acima. 
    O curau está puxando o CMV pra cima — margem de só 18%. 
    Rever o preço ou a ficha técnica dele pode ajudar."

7. Retorna pra tela do chat
```

### Tipos de injeção de contexto:
- **Resumo financeiro:** sempre incluído (lightweight)
- **Dados detalhados:** incluídos quando a pergunta pede (estoque, produtos, clientes)
- **Contexto histórico:** últimas 3 mensagens do chat (memória curta de sessão)
- **Dados pesados (meses de histórico):** só quando explicitamente pedido

---

## 7. TELAS DO APP — UX

### 7.1 Layout Geral
- Sidebar esquerda (desktop) / Bottom nav (mobile)
- Header com nome da loja, usuário logado, notificações
- Tema: claro por padrão, suporte a escuro
- Cores: laranja/amarelo (remetendo a milho/pamonha) + branco + cinza

### 7.2 Telas por módulo

**Dashboard (/):**
- Cards: Faturamento Hoje | CMV Hoje (% + R$) | Itens Vendidos | Ticket Médio
- Cards mês: Receita | CMV | Despesas | Lucro Líquido
- Gráfico linha: faturamento últimos 30 dias
- Gráfico pizza: mix de vendas por produto
- Alertas: estoque baixo, CMV acima da meta
- Botão "Falar com IA"

**PDV (/vendas/pdv):**
- Grid de produtos (cards com foto, nome, preço)
- Carrinho lateral (qty, subtotal)
- Campo de desconto
- Seletor de pagamento (ícones grandes: 💵 PIX 💳)
- Botão FINALIZAR VENDA (grande, verde)
- Campo busca cliente (opcional)

**Produtos (/produtos):**
- Tabela com foto, nome, categoria, preço, custo, margem, status
- Botão "Novo Produto"
- Modal de criação/edição com aba Ficha Técnica (adicionar insumos + qtd)
- Badge colorido na margem: verde >50%, amarelo 20-50%, vermelho <20%

**Estoque (/estoque):**
- Tabela: insumo, unidade, qty atual, mínimo, status (normal/baixo/crítico)
- Cards de alerta no topo se houver insumos críticos
- Botão "Dar Entrada" (modal simples: insumo, qty, custo unitário)
- Botão "Ajuste Inventário"
- Histórico de movimentos por insumo

**CMV (/cmv):**
- Gauge/velocímetro grande mostrando CMV do mês vs. meta
- Tabela por produto: custo, preço, margem, markup, ABC
- Gráfico linha: evolução do CMV mês a mês
- Calculadora: "se preço do milho subir X%, novo CMV seria Y%"

**Financeiro (/financeiro):**
- DRE visual (acordeon com linhas coloridas)
- Fluxo de caixa (linha positivo/negativo)
- Botão "Lançar Despesa"
- Tabela de despesas com filtro por categoria

**Chat IA (/ia):**
- Interface de chat limpa (tipo WhatsApp)
- Mensagens da IA com avatar da loja
- Sugestões de perguntas rápidas (chips clicáveis)
- Histórico de conversas na sidebar

**Relatórios (/relatorios):**
- Cards por tipo de relatório
- Seletor de período (hoje / semana / mês / personalizado)
- Botão Exportar PDF e Exportar Excel
- Preview antes de baixar

---

## 8. ESTRUTURA DE ARQUIVOS DO PROJETO

```
pamonharia-app/
├── prisma/
│   ├── schema.prisma         ← schema completo do banco
│   └── seed.ts               ← dados de exemplo
├── src/
│   ├── app/                  ← Next.js App Router
│   │   ├── layout.tsx        ← layout global (sidebar + header)
│   │   ├── page.tsx          ← dashboard
│   │   ├── (auth)/
│   │   │   └── login/page.tsx
│   │   ├── vendas/
│   │   │   ├── page.tsx      ← lista de vendas
│   │   │   └── pdv/page.tsx  ← PDV (ponto de venda)
│   │   ├── produtos/
│   │   │   ├── page.tsx      ← lista de produtos
│   │   │   └── [id]/page.tsx ← editar produto + ficha técnica
│   │   ├── estoque/
│   │   │   └── page.tsx
│   │   ├── cmv/
│   │   │   └── page.tsx
│   │   ├── financeiro/
│   │   │   └── page.tsx
│   │   ├── clientes/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── fornecedores/
│   │   │   └── page.tsx
│   │   ├── relatorios/
│   │   │   └── page.tsx
│   │   ├── ia/
│   │   │   └── page.tsx      ← chat com IA
│   │   ├── configuracoes/
│   │   │   └── page.tsx
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── products/route.ts
│   │       ├── products/[id]/route.ts
│   │       ├── ingredients/route.ts
│   │       ├── sales/route.ts
│   │       ├── cmv/route.ts
│   │       ├── financial/route.ts
│   │       ├── ai/chat/route.ts
│   │       └── reports/route.ts
│   ├── components/
│   │   ├── ui/               ← shadcn components
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── BottomNav.tsx
│   │   ├── dashboard/
│   │   │   ├── MetricCard.tsx
│   │   │   ├── CMVGauge.tsx
│   │   │   └── SalesChart.tsx
│   │   ├── pdv/
│   │   │   ├── ProductGrid.tsx
│   │   │   └── Cart.tsx
│   │   ├── cmv/
│   │   │   └── ProductCMVTable.tsx
│   │   └── ai/
│   │       └── ChatInterface.tsx
│   ├── lib/
│   │   ├── db.ts             ← Prisma client singleton
│   │   ├── auth.ts           ← NextAuth config
│   │   ├── cmv.ts            ← funções de cálculo CMV
│   │   ├── ai.ts             ← lógica de contexto + prompt pra IA
│   │   └── utils.ts          ← formatações, helpers
│   ├── hooks/
│   │   ├── useCMV.ts
│   │   ├── useSales.ts
│   │   └── useStock.ts
│   └── types/
│       └── index.ts          ← tipos TypeScript globais
├── public/
│   └── logo-placeholder.png
├── .env.example
├── package.json
├── tailwind.config.ts
└── README.md
```

---

## 9. VARIÁVEIS DE AMBIENTE (.env)

```env
# Banco de dados
DATABASE_URL="postgresql://user:pass@host:5432/pamonharia"

# NextAuth
NEXTAUTH_SECRET="gerar com: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"

# IA (pelo menos um)
GOOGLE_AI_API_KEY="..."          # Gemini Flash (grátis)
ANTHROPIC_API_KEY="..."          # Claude Haiku (pago, melhor)

# Storage de imagens (opcional)
CLOUDINARY_URL="cloudinary://..."
```

---

## 10. ETAPAS DE DESENVOLVIMENTO

### Fase 1 — MVP (1 semana) ✅ Essencial
- [ ] Setup Next.js + Prisma + banco + auth
- [ ] Schema e migrations
- [ ] CRUD de Produtos + Ficha Técnica
- [ ] CRUD de Insumos/Estoque
- [ ] PDV básico (registrar venda, baixa de estoque)
- [ ] Cálculo e exibição de CMV (diário + mês)
- [ ] Dashboard básico com métricas

### Fase 2 — Completo (2ª semana)
- [ ] Módulo Financeiro (despesas + DRE)
- [ ] Clientes e fornecedores
- [ ] Relatórios (PDF + Excel)
- [ ] IA integrada (chat com contexto do banco)
- [ ] Alertas de estoque e CMV
- [ ] Refinamento de UI (responsivo, mobile first)

### Fase 3 — Polimento (3ª semana)
- [ ] Análise ABC de produtos
- [ ] Calculadora "e se..." de CMV
- [ ] Projeção de fluxo de caixa
- [ ] Programa de fidelidade (básico)
- [ ] Exportação completa
- [ ] Deploy em produção (Vercel + Neon)
- [ ] Treinamento do cliente

---

## 11. PERGUNTAS PARA O CLIENTE (confirmar antes de começar)

1. Quantos produtos diferentes a loja vende atualmente?
2. Quais são os principais insumos (ingredientes)?
3. Tem mais de 1 funcionário que vai usar o sistema?
4. Tem CNPJ? É MEI ou empresa?
5. Qual o regime tributário? (MEI isento, Simples Nacional = x%)
6. Quer controle de clientes ou só de vendas/estoque?
7. Precisa de impressão de cupom? (Impressora térmica?)
8. Prefere app na nuvem (online) ou instalado no PC da loja?
9. Tem Wi-Fi no local de vendas?
10. Qual o orçamento para o projeto?

---

## 12. MODELO DE NEGÓCIO / PRECIFICAÇÃO PARA KESLEN

| Modelo | Valor sugerido | Observação |
|--------|---------------|------------|
| Projeto fechado (entrega única) | R$ 1.500 – R$ 3.000 | Pago ao entregar |
| **Projeto + manutenção mensal** ✅ | **R$ 1.000 entrega + R$ 89/mês** | **Renda recorrente — RECOMENDADO** |
| SaaS (pode escalar pra outras lojas) | R$ 79 – R$ 149/mês por loja | Escala infinita ✅✅ |

**Recomendação validada (Lumi + Zumi):** cobrar **R$ 1.000 de implantação + R$ 89/mês**.

**Argumento de venda pro cliente:** "O sistema vai te economizar pelo menos 2 horas de planilha por semana, e te mostrar em tempo real se você tá tendo lucro ou prejuízo em cada produto. São R$ 89/mês — menos que 2 pamonhas por dia."

**O que inclui a mensalidade:**
- Hospedagem (Vercel + Neon — custo real: ~R$ 0 no free tier)
- Suporte via WhatsApp (Zumi) ou Telegram
- Atualizações do sistema
- Backup automático

Se escalar pra SaaS (múltiplas lojas), adapta multi-tenant e vai pra R$ 89-149/mês por loja.

---

## 13. RISCOS E PONTOS DE ATENÇÃO

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Cliente não sabe custo dos insumos | Alto — inviabiliza CMV | Ajudar no primeiro cadastro |
| Insumos com custo variável (milho sobe/desce) | Médio | Permitir atualizar preço do insumo fácil |
| IA dando resposta errada (alucinação) | Médio | Mostrar os dados que embasam a resposta |
| Cliente sem celular bom pra PDV | Baixo | UI funciona em celular básico com Chrome |
| Perda de dados | Alto | Backup automático (Neon faz isso) |

---

## 14. DIFERENCIAIS VS. CONCORRENTES

| Funcionalidade | Sistemas genéricos | **Pamonharia App** |
|---------------|-------------------|-------------------|
| CMV por produto | ❌ raros | ✅ nativo |
| Ficha técnica de insumos | ❌ | ✅ |
| IA em linguagem natural | ❌ | ✅ |
| Mobile first | ❌ maioria desktop | ✅ |
| Preço | R$200-500/mês | R$120/mês |
| Adaptado pra alimentos | ❌ genérico | ✅ feito pra pamonharia |

---

## STATUS E PRÓXIMOS PASSOS

- [x] Planejamento completo criado (Lumi + Zumi)
- [ ] **AGUARDANDO:** resposta do cliente sobre as 10 perguntas (seção 11)
- [ ] Definir nome comercial do app
- [ ] Definir identidade visual (cores, logo)
- [ ] Keslen confirma início do desenvolvimento
- [ ] **Lumi inicia Fase 1** (setup + banco + MVP)

---

> **Notas internas:**
> - Lumi (PC) lidera o código — Next.js, banco, IA, API
> - Zumi (celular) apoia com ideias de UX, testa no mobile, valida com o cliente
> - Keslen toca o projeto e apresenta pro cliente
> - Guardar esse arquivo em `~/Projetos/pamonharia-app/PLANEJAMENTO.md`
