import Link from "next/link";
import { createProject } from "@/actions/projects";
import { HealthPill, TimelineRail } from "@/components/analytics";
import { MotionPage } from "@/components/motion";
import { ProviderShell } from "@/components/provider-shell";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { requireProviderUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { FolderKanban } from "lucide-react";


export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let projects: any[] = [];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let clients: any[] = [];

  const user = await requireProviderUser();

  [projects, clients] = await Promise.all([
    prisma.project.findMany({
      where: {
        organizationId: user.organizationId ?? "",
        members:
          user.role === "MEMBER"
            ? { some: { userId: user.id } }
            : undefined
      },
      include: {
        client: true
      },
      orderBy: {
        updatedAt: "desc"
      }
    }),

    prisma.client.findMany({
      where: {
        organizationId: user.organizationId ?? ""
      },
      orderBy: {
        companyName: "asc"
      }
    })
  ]);
  const statuses = ["DRAFT", "ACTIVE", "PAUSED", "COMPLETED"] as const;

  return (
    <ProviderShell>
      <MotionPage>
        <PageHeader title="Projects" description="Kanban, timeline, health indicators, milestones, deliverables, and client approvals." />
        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-4">
              {statuses.map((status) => {
                const group = projects.filter((project) => project.status === status);
                return (
                  <Card key={status} className="min-h-72 bg-card/75">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">{status.toLowerCase()}</CardTitle>
                        <Badge>{group.length}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {group.length === 0 ? (
                        <div className="rounded-lg border border-dashed p-4 text-xs text-muted-foreground">No projects here.</div>
                      ) : (
                        group.map((project) => (
                          <Link key={project.id} href={`/projects/${project.id}`} className="block rounded-lg border bg-background/80 p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="text-sm font-semibold">{project.name}</div>
                                <div className="text-xs text-muted-foreground">{project.client.companyName}</div>
                              </div>
                              <HealthPill progress={project.progressPercent} dueDate={project.dueDate} />
                            </div>
                            <Progress value={project.progressPercent} className="mt-3" />
                            <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                              <span>{project.budget ? formatCurrency(project.budget.toString()) : "No budget"}</span>
                              <span>{formatDate(project.dueDate)}</span>
                            </div>
                          </Link>
                        ))
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <Card>
              <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
              <CardContent>
                {projects.length === 0 ? (
                  <EmptyState icon={FolderKanban} title="No timeline yet" description="Create your first project to map delivery across milestones and due dates." />
                ) : (
                  <TimelineRail items={projects.map((project) => ({ title: `${project.name} · ${formatDate(project.dueDate)}`, status: project.status, progress: project.progressPercent }))} />
                )}
              </CardContent>
            </Card>
          </div>
        <Card className="glass-panel">
          <CardHeader><CardTitle>New project</CardTitle></CardHeader>
          <CardContent>
            <form action={createProject} 
             className="space-y-4">
              <div className="space-y-2">
                <Label>Client</Label>
                <select name="clientId" className="focus-ring h-9 w-full rounded-md border bg-background px-3 text-sm" required>
                  <option value="">Select client</option>
                  {clients.map((client) => <option key={client.id} value={client.id}>{client.companyName}</option>)}
                </select>
              </div>
              <div className="space-y-2"><Label>Name</Label><Input name="name" required /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea name="description" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Status</Label><select name="status" className="focus-ring h-9 w-full rounded-md border bg-background px-3 text-sm"><option>ACTIVE</option><option>DRAFT</option><option>PAUSED</option></select></div>
                <div className="space-y-2"><Label>Progress</Label><Input name="progressPercent" type="number" min="0" max="100" defaultValue="0" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Due date</Label><Input name="dueDate" type="date" /></div>
                <div className="space-y-2"><Label>Budget</Label><Input name="budget" type="number" step="0.01" /></div>
              </div>
              <Button
                type="submit"
                className="w-full"
              >
                {"Create project"}
              </Button>
            </form>
          </CardContent>
        </Card>
        </div>
      </MotionPage>
    </ProviderShell>
  );
}
