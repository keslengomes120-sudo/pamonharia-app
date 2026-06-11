"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-8 h-8" />;

  const isDark = theme === "dark";
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`w-8 h-8 flex items-center justify-center rounded-lg text-base transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${className ?? ""}`}
      title={isDark ? "Modo claro" : "Modo escuro"}
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}
