import { MobileDrawer } from "./MobileDrawer";
import { ThemeToggle } from "./ThemeToggle";

export function MobileHeader({ storeName, role, permissions }: { storeName?: string; role?: string; permissions?: string[] | null }) {
  return (
    <header className="md:hidden sticky top-0 z-20 flex items-center justify-between px-3 py-2.5 bg-card border-b border-border">
      <div className="flex items-center gap-2">
        <MobileDrawer storeName={storeName} role={role} permissions={permissions} />
        <div className="flex items-center gap-2">
          <span className="text-xl">🌽</span>
          <p className="font-semibold text-sm text-foreground truncate max-w-[180px]">
            {storeName ?? "Crescer Estratégico"}
          </p>
        </div>
      </div>
      <ThemeToggle />
    </header>
  );
}
