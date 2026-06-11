import { MobileDrawer } from "./MobileDrawer";
import { ThemeToggle } from "./ThemeToggle";

export function MobileHeader({ storeName, role }: { storeName?: string; role?: string }) {
  return (
    <header className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
      <div className="flex items-center gap-3">
        <MobileDrawer storeName={storeName} role={role} />
        <div className="flex items-center gap-2">
          <span className="text-xl">🌽</span>
          <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate max-w-[180px]">
            {storeName ?? "Pamonharia App"}
          </p>
        </div>
      </div>
      <ThemeToggle />
    </header>
  );
}
