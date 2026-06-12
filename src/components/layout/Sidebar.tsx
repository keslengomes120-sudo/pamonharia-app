"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import { visibleNav } from "./nav";

export default function Sidebar({ storeName, role, permissions }: { storeName?: string; role?: string; permissions?: string[] | null }) {
  const path = usePathname();
  const isAdmin = role === "admin";
  const visible = visibleNav(role ?? "operador", permissions ?? null);

  return (
    <aside className="hidden md:flex flex-col w-60 bg-card border-r border-border h-screen fixed left-0 top-0 z-30">
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌽</span>
          <div>
            <p className="font-bold text-foreground leading-tight text-sm">Crescer Estratégico</p>
            <p className="text-xs text-subtle truncate max-w-[120px]">{storeName ?? "Minha loja"}</p>
          </div>
        </div>
        <ThemeToggle />
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {visible.map((item) => {
          const active = path === item.href || (item.href !== "/" && path.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                active
                  ? "bg-primary-soft text-primary-soft-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border">
        {!isAdmin && (
          <p className="text-[10px] text-subtle px-3 mb-2">Usuário</p>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-danger-soft hover:text-danger transition-colors"
        >
          <LogOut size={18} /> Sair
        </button>
      </div>
    </aside>
  );
}
