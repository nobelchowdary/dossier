import { LucideIcon, ArrowUpRight, Activity, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MotionCard } from "@/components/motion";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "neutral"
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: LucideIcon;
  tone?: "neutral" | "success" | "warning" | "accent";
}) {
  const tones = {
    neutral: "from-slate-500/12",
    success: "from-emerald-500/16",
    warning: "from-amber-500/16",
    accent: "from-cyan-500/16"
  };

  return (
    <MotionCard>
      <Card className="relative overflow-hidden">
        <div className={cn("absolute inset-x-0 top-0 h-24 bg-gradient-to-b to-transparent", tones[tone])} />
        <CardContent className="relative p-5">
          <div className="flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-background shadow-sm">
              <Icon className="h-4 w-4 text-accent" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-5 text-2xl font-semibold tracking-normal">{value}</div>
          <div className="mt-1 text-sm font-medium">{label}</div>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</p>
        </CardContent>
      </Card>
    </MotionCard>
  );
}

export function MiniBarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((item) => item.value), 1);
  return (
    <div className="flex h-44 items-end gap-3">
      {data.map((item, index) => (
        <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex h-32 w-full items-end rounded-md bg-muted/60 p-1">
            <div
              className="w-full rounded bg-gradient-to-t from-accent to-cyan-300 shadow-[0_0_18px_hsl(var(--accent)/0.25)] transition-all duration-700"
              style={{ height: `${Math.max(8, (item.value / max) * 100)}%`, transitionDelay: `${index * 80}ms` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export function HealthPill({ progress, dueDate }: { progress: number; dueDate?: Date | null }) {
  const dueSoon = dueDate ? dueDate.getTime() - Date.now() < 1000 * 60 * 60 * 24 * 7 : false;
  const healthy = progress >= 70 && !dueSoon;
  const warning = dueSoon && progress < 80;
  const Icon = healthy ? CheckCircle2 : warning ? AlertTriangle : Activity;
  const label = healthy ? "healthy" : warning ? "at risk" : "steady";

  return (
    <Badge className={cn(warning && "border-amber-200 bg-amber-50 text-amber-700", healthy && "border-emerald-200 bg-emerald-50 text-emerald-700")}>
      <Icon className="mr-1 h-3 w-3" />
      {label}
    </Badge>
  );
}

export function TimelineRail({
  items
}: {
  items: { title: string; status: string; date?: Date | null; progress?: number }[];
}) {
  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={`${item.title}-${index}`} className="grid grid-cols-[24px_1fr] gap-3">
          <div className="flex flex-col items-center">
            <div className="mt-1 h-3 w-3 rounded-full border-2 border-background bg-accent shadow-[0_0_0_3px_hsl(var(--accent)/0.18)]" />
            {index < items.length - 1 ? <div className="mt-2 h-full min-h-10 w-px bg-border" /> : null}
          </div>
          <div className="rounded-lg border bg-background/70 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="font-medium">{item.title}</div>
              <Badge>{item.status}</Badge>
            </div>
            {typeof item.progress === "number" ? <Progress value={item.progress} className="mt-3" /> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
