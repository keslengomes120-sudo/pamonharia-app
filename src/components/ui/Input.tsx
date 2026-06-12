import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "w-full h-11 px-4 rounded-xl border border-border bg-card text-foreground text-base placeholder:text-subtle",
        "focus:outline-none focus:ring-2 focus:ring-ring transition-colors",
        className
      )}
      {...props}
    />
  );
}
