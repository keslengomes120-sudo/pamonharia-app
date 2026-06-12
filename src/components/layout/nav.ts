import {
  LayoutDashboard, ShoppingCart, ClipboardList, Receipt, ChefHat,
  Package, Tag, Boxes, TrendingUp, Banknote, Users, Bot, UserCog, Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; icon: LucideIcon; label: string; adminOnly?: boolean };

export const nav: NavItem[] = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/pdv", icon: ShoppingCart, label: "PDV" },
  { href: "/comandas", icon: ClipboardList, label: "Comandas" },
  { href: "/caixa", icon: Receipt, label: "Caixa" },
  { href: "/producao", icon: ChefHat, label: "Produção" },
  { href: "/produtos", icon: Package, label: "Produtos", adminOnly: true },
  { href: "/categorias", icon: Tag, label: "Categorias", adminOnly: true },
  { href: "/estoque", icon: Boxes, label: "Estoque", adminOnly: true },
  { href: "/cmv", icon: TrendingUp, label: "CMV", adminOnly: true },
  { href: "/financeiro", icon: Banknote, label: "Financeiro", adminOnly: true },
  { href: "/clientes", icon: Users, label: "Clientes", adminOnly: true },
  { href: "/ia", icon: Bot, label: "Assistente IA" },
  { href: "/usuarios", icon: UserCog, label: "Usuários", adminOnly: true },
  { href: "/configuracoes", icon: Settings, label: "Configurações", adminOnly: true },
];
