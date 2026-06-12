import {
  LayoutDashboard, ShoppingCart, ClipboardList, Receipt, ChefHat,
  Package, Tag, Boxes, TrendingUp, Banknote, Users, Bot, UserCog, Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; icon: LucideIcon; label: string };

export const nav: NavItem[] = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/pdv", icon: ShoppingCart, label: "PDV" },
  { href: "/comandas", icon: ClipboardList, label: "Comandas" },
  { href: "/caixa", icon: Receipt, label: "Caixa" },
  { href: "/producao", icon: ChefHat, label: "Produção" },
  { href: "/produtos", icon: Package, label: "Produtos" },
  { href: "/categorias", icon: Tag, label: "Categorias" },
  { href: "/estoque", icon: Boxes, label: "Estoque" },
  { href: "/cmv", icon: TrendingUp, label: "CMV" },
  { href: "/financeiro", icon: Banknote, label: "Financeiro" },
  { href: "/clientes", icon: Users, label: "Clientes" },
  { href: "/ia", icon: Bot, label: "Assistente IA" },
  { href: "/usuarios", icon: UserCog, label: "Usuários" },
  { href: "/configuracoes", icon: Settings, label: "Configurações" },
];

// Módulos que um usuário comum pode receber acesso. Dashboard e gestão de
// usuários/configurações ficam restritos ao admin.
const ADMIN_ONLY = ["/", "/usuarios", "/configuracoes"];

export const grantableNav: NavItem[] = nav.filter((i) => !ADMIN_ONLY.includes(i.href));

// Acesso padrão de um usuário comum recém-criado sem permissões definidas.
export const DEFAULT_PERMISSIONS = ["/pdv", "/comandas", "/caixa", "/producao", "/ia"];

export function visibleNav(role: string, permissions: string[] | null): NavItem[] {
  if (role === "admin") return nav;
  const allowed = permissions?.length ? permissions : DEFAULT_PERMISSIONS;
  return nav.filter((i) => allowed.includes(i.href));
}

export function parsePermissions(raw: string | null | undefined): string[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((p): p is string => typeof p === "string") : null;
  } catch {
    return null;
  }
}
