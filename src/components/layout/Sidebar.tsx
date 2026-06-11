"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

type NavItem = { href: string; icon: string; label: string; adminOnly?: boolean };

const nav: NavItem[] = [
  { href: "/", icon: "📊", label: "Dashboard" },
  { href: "/pdv", icon: "💰", label: "PDV" },
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

export default function Sidebar({ storeName, role }: { storeName?: string; role?: string }) {
  const path = usePathname();
  const isAdmin = role === "admin";
  const visible = nav.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside className="hidden md:flex flex-col w-60 bg-white border-r border-gray-100 min-h-screen fixed left-0 top-0 z-30">
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌽</span>
          <div>
            <p className="font-bold text-gray-900 leading-tight text-sm">Pamonharia App</p>
            <p className="text-xs text-gray-400 truncate max-w-[140px]">{storeName ?? "Minha loja"}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {visible.map((item) => {
          const active = path === item.href || (item.href !== "/" && path.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                active
                  ? "bg-orange-50 text-orange-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-100">
        {!isAdmin && (
          <p className="text-[10px] text-gray-300 px-3 mb-2">Operador</p>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <span>🚪</span> Sair
        </button>
      </div>
    </aside>
  );
}
