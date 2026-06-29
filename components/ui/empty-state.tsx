import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  className
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div className={cn("relative flex min-h-56 flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed bg-card/60 p-8 text-center", className)}>
      <div className="absolute inset-x-10 top-6 h-24 rounded-full bg-accent/10 blur-3xl" />
      <div className="relative mb-4 flex h-12 w-12 items-center justify-center rounded-lg border bg-background shadow-sm">
        <Icon className="h-6 w-6 text-accent" aria-hidden />
      </div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
