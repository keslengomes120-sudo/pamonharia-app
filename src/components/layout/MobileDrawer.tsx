"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import { visibleNav } from "./nav";

export function MobileDrawer({ storeName, role, permissions }: { storeName?: string; role?: string; permissions?: string[] | null }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const isAdmin = role === "admin";
  const visible = visibleNav(role ?? "operador", permissions ?? null);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          aria-label="Abrir menu"
          className="w-9 h-9 flex items-center justify-center rounded-lg text-foreground hover:bg-muted transition-colors"
        >
          <Menu size={22} />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-card shadow-xl flex flex-col outline-none">
          <Dialog.Title className="sr-only">Menu de navegação</Dialog.Title>
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌽</span>
              <div>
                <p className="font-bold text-sm text-foreground">Crescer Estratégico</p>
                <p className="text-xs text-subtle truncate max-w-[160px]">{storeName ?? "Minha loja"}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <Dialog.Close
                aria-label="Fechar menu"
                className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X size={20} />
              </Dialog.Close>
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {visible.map((item) => {
              const active = path === item.href || (item.href !== "/" && path.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Dialog.Close asChild key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors",
                      active
                        ? "bg-primary-soft text-primary-soft-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <Icon size={20} />
                    {item.label}
                  </Link>
                </Dialog.Close>
              );
            })}
          </nav>

          <div className="p-3 border-t border-border">
            {!isAdmin && (
              <p className="text-[10px] text-subtle px-3 mb-2">Usuário</p>
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm text-muted-foreground hover:bg-danger-soft hover:text-danger transition-colors"
            >
              <LogOut size={20} /> Sair
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
