import Link from "next/link";
import { MotionPage } from "@/components/motion";
import { PortalShell } from "@/components/portal-shell";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { requireClientUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { FolderKanban } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PortalPage() {
  const user = await requireClientUser();

  const client = await prisma.client.findFirst({
    where: {
      userId: user.id,
    },
    include: {
      projects: {
        where: {
          status: {
            not: "ARCHIVED",
          },
        },
        include: {
          deliverables: true,
          milestones: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
      },
    },
  });


  return (
    <PortalShell>
      <MotionPage>
        <PageHeader
          title="Your workspace"
          description="A private portal for project progress, approvals, files, invoices, and communication."
        />

        {client?.projects?.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {client.projects.map((project) => (
              <Link key={project.id} href={`/portal/projects/${project.id}`}>
                <Card>
                  <CardHeader>
                    <CardTitle>{project.name}</CardTitle>
                    <Badge>{project.status}</Badge>
                  </CardHeader>

                  <CardContent>
                    <div>{project.description}</div>

                    <div className="mt-4">
                      <Progress value={project.progressPercent} />
                    </div>

                    <div className="mt-4">
                      Due: {project.dueDate
                      ? formatDate(project.dueDate)
                      : "No due date"}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FolderKanban}
            title="No projects yet"
            description="When your provider shares a project, progress and approvals will appear here."
          />
        )}
      </MotionPage>
    </PortalShell>
  );
}