"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const adminNav = [
  { href: "/", icon: "📊", label: "Início" },
  { href: "/pdv", icon: "💰", label: "PDV" },
  { href: "/cmv", icon: "📈", label: "CMV" },
  { href: "/estoque", icon: "📦", label: "Estoque" },
  { href: "/ia", icon: "🤖", label: "IA" },
];

const operadorNav = [
  { href: "/pdv", icon: "💰", label: "PDV" },
  { href: "/producao", icon: "🥟", label: "Produção" },
  { href: "/ia", icon: "🤖", label: "IA" },
];

export default function BottomNav({ role }: { role?: string }) {
  const path = usePathname();
  const nav = role === "admin" ? adminNav : operadorNav;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 pb-safe">
      <div className="flex">
        {nav.map((item) => {
          const active = path === item.href || (item.href !== "/" && path.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center gap-0.5 py-3 text-xs font-medium transition-colors",
                active ? "text-orange-600" : "text-gray-400"
              )}
            >
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
