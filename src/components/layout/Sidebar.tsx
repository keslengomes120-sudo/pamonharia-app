"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import { nav } from "./nav";

export default function Sidebar({ storeName, role }: { storeName?: string; role?: string }) {
  const path = usePathname();
  const isAdmin = role === "admin";
  const visible = nav.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside className="hidden md:flex flex-col w-60 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 min-h-screen fixed left-0 top-0 z-30">
      <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌽</span>
          <div>
            <p className="font-bold text-gray-900 dark:text-gray-100 leading-tight text-sm">Crescer Estratégico</p>
            <p className="text-xs text-gray-400 truncate max-w-[120px]">{storeName ?? "Minha loja"}</p>
          </div>
        </div>
        <ThemeToggle />
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
                  ? "bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-400"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
              )}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-100 dark:border-gray-800">
        {!isAdmin && (
          <p className="text-[10px] text-gray-300 dark:text-gray-600 px-3 mb-2">Operador</p>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 transition-colors"
        >
          <span>🚪</span> Sair
        </button>
      </div>
    </aside>
  );
}
