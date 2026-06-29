import { ActivityLog, Project, User } from "@prisma/client";
import { Bell, Dot } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export function ActivityCenter({
  items
}: {
  items: (ActivityLog & { actor: User | null; project: Project | null })[];
}) {
  return (
    <Card className="glass-panel">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Bell className="h-4 w-4 text-accent" />
          Activity center
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet. New client work will appear here.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="grid grid-cols-[20px_1fr] gap-2">
              <Dot className="mt-0.5 h-5 w-5 text-accent" />
              <div>
                <div className="text-sm font-medium">{item.action.replaceAll(".", " ")}</div>
                <div className="text-xs text-muted-foreground">
                  {item.project?.name ?? item.targetType} · {item.actor?.name ?? item.actor?.email ?? "System"} · {formatDate(item.createdAt)}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
