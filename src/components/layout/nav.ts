export type NavItem = { href: string; icon: string; label: string; adminOnly?: boolean };

export const nav: NavItem[] = [
  { href: "/", icon: "📊", label: "Dashboard" },
  { href: "/pdv", icon: "💰", label: "PDV" },
  { href: "/comandas", icon: "📝", label: "Comandas" },
  { href: "/caixa", icon: "🧾", label: "Caixa" },
  { href: "/producao", icon: "🥟", label: "Produção" },
  { href: "/produtos", icon: "📋", label: "Produtos", adminOnly: true },
  { href: "/categorias", icon: "🏷️", label: "Categorias", adminOnly: true },
  { href: "/estoque", icon: "📦", label: "Estoque", adminOnly: true },
  { href: "/cmv", icon: "📈", label: "CMV", adminOnly: true },
  { href: "/financeiro", icon: "💵", label: "Financeiro", adminOnly: true },
  { href: "/clientes", icon: "👥", label: "Clientes", adminOnly: true },
  { href: "/ia", icon: "🤖", label: "Assistente IA" },
  { href: "/usuarios", icon: "🧑‍💼", label: "Usuários", adminOnly: true },
  { href: "/configuracoes", icon: "⚙️", label: "Configurações", adminOnly: true },
];
