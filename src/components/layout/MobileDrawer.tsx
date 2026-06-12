"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import { nav } from "./nav";

export function MobileDrawer({ storeName, role }: { storeName?: string; role?: string }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const isAdmin = role === "admin";
  const visible = nav.filter((item) => !item.adminOnly || isAdmin);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="w-8 h-8 flex flex-col items-center justify-center gap-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <span className="block w-5 h-0.5 bg-gray-700 dark:bg-gray-300 rounded" />
          <span className="block w-5 h-0.5 bg-gray-700 dark:bg-gray-300 rounded" />
          <span className="block w-5 h-0.5 bg-gray-700 dark:bg-gray-300 rounded" />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-white dark:bg-gray-900 shadow-xl flex flex-col outline-none">
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌽</span>
              <div>
                <p className="font-bold text-sm text-gray-900 dark:text-gray-100">Crescer Estratégico</p>
                <p className="text-xs text-gray-400 truncate max-w-[160px]">{storeName ?? "Minha loja"}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <Dialog.Close className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400">
                ✕
              </Dialog.Close>
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {visible.map((item) => {
              const active = path === item.href || (item.href !== "/" && path.startsWith(item.href));
              return (
                <Dialog.Close asChild key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors",
                      active
                        ? "bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-400"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                    )}
                  >
                    <span className="text-lg">{item.icon}</span>
                    {item.label}
                  </Link>
                </Dialog.Close>
              );
            })}
          </nav>

          <div className="p-3 border-t border-gray-100 dark:border-gray-800">
            {!isAdmin && (
              <p className="text-[10px] text-gray-300 px-3 mb-2">Operador</p>
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 transition-colors"
            >
              <span>🚪</span> Sair
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
