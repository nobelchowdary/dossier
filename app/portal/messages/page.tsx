import Link from "next/link";
import { PortalShell } from "@/components/portal-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireClientUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PortalMessagesPage() {
  const user = await requireClientUser();
  const projects = await prisma.project.findMany({
    where: { client: { userId: user.id } },
    include: { messages: { include: { sender: true }, orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { updatedAt: "desc" }
  });

  return (
    <PortalShell>
      <PageHeader title="Messages" description="Open a project thread to continue the conversation." />
      <div className="space-y-3">
        {projects.map((project) => (
          <Link key={project.id} href={`/portal/projects/${project.id}`}>
            <Card className="transition-colors hover:bg-muted/30">
              <CardHeader><CardTitle>{project.name}</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {project.messages[0] ? `${project.messages[0].sender.name ?? project.messages[0].sender.email}: ${project.messages[0].body}` : "No messages yet"}
                <div className="mt-2 text-xs">{project.messages[0] ? formatDate(project.messages[0].createdAt) : ""}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </PortalShell>
  );
}
