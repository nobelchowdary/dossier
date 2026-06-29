import { MotionPage } from "@/components/motion";
import { ProviderShell } from "@/components/provider-shell";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireProviderUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await requireProviderUser();

  const notifications =
    await prisma.activityLog.findMany({
      where: {
        organizationId:
          user.organizationId ?? "",
      },
      include: {
        actor: true,
        project: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

  return (
    <ProviderShell>
      <MotionPage>
        <PageHeader
          title="Notifications"
          description="Recent activity across your workspace."
        />

        <Card>
          <CardHeader>
            <CardTitle>
              Activity Feed
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {notifications.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No notifications yet.
              </div>
            ) : (
              notifications.map(
                (item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border p-4"
                  >
                    <div className="flex items-center justify-between">
                      <Badge>
                        {item.targetType}
                      </Badge>

                      <span className="text-xs text-muted-foreground">
                        {formatDate(
                          item.createdAt
                        )}
                      </span>
                    </div>

                    <div className="mt-2 font-medium">
                      {item.action}
                    </div>

                    <div className="mt-1 text-sm text-muted-foreground">
                      By{" "}
                      {item.actor?.name ??
                        item.actor?.email ??
                        "System"}
                    </div>

                    {item.project && (
                      <div className="mt-1 text-sm">
                        Project:{" "}
                        {item.project.name}
                      </div>
                    )}

                    {item.metadata && (
                      <pre className="mt-3 overflow-auto rounded bg-muted p-3 text-xs">
                        {JSON.stringify(
                          item.metadata,
                          null,
                          2
                        )}
                      </pre>
                    )}
                  </div>
                )
              )
            )}
          </CardContent>
        </Card>
      </MotionPage>
    </ProviderShell>
  );
}