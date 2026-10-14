import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "default",
  children,
}: {
  className?: string;
  tone?: "default" | "sky" | "green" | "warn" | "muted";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tone === "default" && "bg-primary/10 text-primary",
        tone === "sky" && "bg-tasco-lime/15 text-tasco-forest",
        tone === "green" && "bg-vetc-green/15 text-vetc-green",
        tone === "warn" && "bg-amber-100 text-amber-800",
        tone === "muted" && "bg-muted text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}