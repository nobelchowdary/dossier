import { notFound } from "next/navigation";
import { approveDeliverable, requestDeliverableRevision } from "@/actions/projects";
import { TimelineRail } from "@/components/analytics";
import { MessagesPanel } from "@/components/messages-panel";
import { MotionPage } from "@/components/motion";
import { PortalShell } from "@/components/portal-shell";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { assertProjectAccess } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import type { Attachment } from "@/lib/validators";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PortalProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await assertProjectAccess(id);
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      milestones: { orderBy: { sortOrder: "asc" } },
      deliverables: { orderBy: { submittedAt: "desc" } },
      messages: { include: { sender: true }, orderBy: { createdAt: "asc" }, take: 50 }
    }
  });
  if (!project) notFound();

  return (
    <PortalShell>
      <MotionPage>
        <PageHeader title={project.name} description={project.description ?? "Project details and approvals"} />
        <Card className="mb-6 overflow-hidden glass-panel">
          <div className="h-1 bg-gradient-to-r from-accent via-cyan-400 to-emerald-400" />
          <CardContent className="grid gap-6 p-6 md:grid-cols-[1fr_260px]">
            <div>
              <div className="text-sm text-muted-foreground">Current progress</div>
              <div className="mt-2 text-4xl font-semibold">{project.progressPercent}%</div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{project.aiSummary ?? "Your provider has not published an AI-generated update yet."}</p>
            </div>
            <div className="rounded-lg border bg-background/70 p-4">
              <Progress value={project.progressPercent} />
              <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs text-muted-foreground">
                <div className="rounded-md bg-muted/50 p-2">{project.milestones.length}<br />milestones</div>
                <div className="rounded-md bg-muted/50 p-2">{project.deliverables.length}<br />deliverables</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Progress</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Progress value={project.progressPercent} />
              <p className="text-sm text-muted-foreground">{project.aiSummary ?? "Your provider has not published an AI-generated update yet."}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
            <CardContent>
              <TimelineRail items={project.milestones.map((milestone) => ({ title: `${milestone.title} - ${milestone.dueDate
  ? formatDate(milestone.dueDate)
  : "No due date"}`, status: milestone.status }))} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Milestones</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {project.milestones.map((milestone) => (
                <div key={milestone.id} className="flex items-start justify-between rounded-lg border p-4">
                  <div>
                    <div className="font-medium">{milestone.title}</div>
                    <p className="text-sm text-muted-foreground">{milestone.description}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{milestone.dueDate
  ? formatDate(milestone.dueDate)
  : "No due date"}</p>
                  </div>
                  <Badge>{milestone.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Deliverables</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {project.deliverables.map((deliverable) => (
                <div
                  key={deliverable.id}
                  className="rounded-lg border bg-background/70 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-medium">
                        {deliverable.title}
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {deliverable.description}
                      </p>

                      {deliverable.fileName ? (
                        <a
                          href={`/api/uploads/download?deliverableId=${deliverable.id}`}
                          className="mt-3 block rounded-md border bg-muted/50 px-3 py-2 text-sm text-accent hover:bg-muted"
                        >
                          {deliverable.fileName}
                        </a>
                      ) : null}

                      {deliverable.revisionNotes && (
                        <div className="mt-3 rounded-md border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm">
                          <strong>Revision Notes:</strong>
                          <br />
                          {deliverable.revisionNotes}
                        </div>
                      )}
                    </div>

                    <Badge>
                      {deliverable.status}
                    </Badge>
                  </div>

                  {deliverable.status === "SUBMITTED" && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <form
                        action={approveDeliverable.bind(
                          null,
                          deliverable.id
                        )}
                      >
                        <Button size="sm">
                          Approve
                        </Button>
                      </form>

                      <form
                        action={requestDeliverableRevision.bind(
                          null,
                          deliverable.id
                        )}
                        className="flex gap-2"
                      >
                        <Input
                          name="revisionNotes"
                          placeholder="Revision notes"
                          required
                        />

                        <Button
                          size="sm"
                          variant="outline"
                        >
                          Request Revision
                        </Button>
                      </form>
                    </div>
                  )}

                  {deliverable.status === "APPROVED" && (
                    <div className="mt-3 text-sm font-medium text-green-600">
                      ✓ Approved
                    </div>
                  )}

                  {deliverable.status ===
                    "REVISION_REQUESTED" && (
                    <div className="mt-3 text-sm font-medium text-yellow-600">
                      Revision Requested
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader><CardTitle>Messages</CardTitle></CardHeader>
          <CardContent><MessagesPanel projectId={project.id} currentUserId={user.id} initialMessages={project.messages.map((message) => ({ ...message, createdAt: message.createdAt.toISOString(), attachments: (message.attachments ?? []) as Attachment[] }))} /></CardContent>
        </Card>
      </div>
      </MotionPage>
    </PortalShell>
  );
}
