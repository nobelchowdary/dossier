import { notFound } from "next/navigation";
import { approveDeliverable, createMilestone, requestDeliverableRevision, updateProject } from "@/actions/projects";
import { generateUpdate } from "@/actions/ai";
import { HealthPill, TimelineRail } from "@/components/analytics";
import { DeliverableUploader } from "@/components/deliverable-uploader";
import { MessagesPanel } from "@/components/messages-panel";
import { MotionPage } from "@/components/motion";
import { ProviderShell } from "@/components/provider-shell";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { assertProjectAccess } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Attachment } from "@/lib/validators";
import {
  assignMember,
  unassignMember,
} from "@/actions/project-members";
export const dynamic = "force-dynamic";


export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await assertProjectAccess(id);
  const project = await prisma.project.findUnique({
  where: { id },
  include: {
    client: true,

    members: {
      include: {
        user: true,
      },
    },

    milestones: {
      orderBy: {
        sortOrder: "asc",
      },
    },

    deliverables: {
      orderBy: {
        submittedAt: "desc",
      },
    },

    messages: {
      include: {
        sender: true,
      },
      orderBy: {
        createdAt: "asc",
      },
      take: 50,
    },

    invoices: true,
  },
});
  if (!project) notFound();

  const clients = await prisma.client.findMany({
    where: { organizationId: user.organizationId ?? "" },
    orderBy: { companyName: "asc" }
  });
  const teamMembers =
  await prisma.user.findMany({
    where: {
      organizationId:
        user.organizationId ?? "",

      role:{
        in : ["ADMIN","MEMBER"]
      }
    },

    orderBy: {
      name: "asc",
    },
  });
  const saveProject = updateProject.bind(null, project.id);
  const runSummary = generateUpdate.bind(null, project.id);

  return (
    <ProviderShell>
      <MotionPage>
        <PageHeader
          title={project.name}
          description={`${project.client.companyName} - ${project.progressPercent}% complete - ${formatCurrency(Number(project.budget ?? 0))}`}
          actions={
            user.role !== "MEMBER" ? (
              <form action={runSummary}>
                <Button
                  type="submit"
                  variant="outline"
                >
                  Generate Update
                </Button>
              </form>
            ) : undefined
          }
        />

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card className="glass-panel"><CardContent className="p-5"><div className="text-xs text-muted-foreground">Progress</div><div className="mt-2 text-2xl font-semibold">{project.progressPercent}%</div><Progress value={project.progressPercent} className="mt-3" /></CardContent></Card>
          <Card className="glass-panel"><CardContent className="p-5"><div className="text-xs text-muted-foreground">Health</div><div className="mt-3"><HealthPill progress={project.progressPercent} dueDate={project.dueDate} /></div></CardContent></Card>
          <Card className="glass-panel"><CardContent className="p-5"><div className="text-xs text-muted-foreground">Deliverables</div><div className="mt-2 text-2xl font-semibold">{project.deliverables.length}</div></CardContent></Card>
          <Card className="glass-panel"><CardContent className="p-5"><div className="text-xs text-muted-foreground">Invoices</div><div className="mt-2 text-2xl font-semibold">{project.invoices.length}</div></CardContent></Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <div className="space-y-6">
            {user.role !== "MEMBER" && (
            <Card>
              <CardHeader>
                <CardTitle>Overview</CardTitle>
                <CardDescription>Provider-only controls for scope, budget, schedule, and delivery status.</CardDescription>
              </CardHeader>
              <CardContent>
                <form action={saveProject} className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2"><Label>Name</Label><Input name="name" defaultValue={project.name} /></div>
                  <div className="space-y-2"><Label>Client</Label><select name="clientId" defaultValue={project.clientId} className="focus-ring h-9 w-full rounded-md border bg-background px-3 text-sm">{clients.map((client) => <option key={client.id} value={client.id}>{client.companyName}</option>)}</select></div>
                  <div className="space-y-2 md:col-span-2"><Label>Description</Label><Textarea name="description" defaultValue={project.description ?? ""} /></div>
                  <div className="space-y-2"><Label>Status</Label><select name="status" defaultValue={project.status} className="focus-ring h-9 w-full rounded-md border bg-background px-3 text-sm">{["DRAFT", "ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"].map((status) => <option key={status}>{status}</option>)}</select></div>
                  <div className="space-y-2"><Label>Progress</Label><Input name="progressPercent" type="number" defaultValue={project.progressPercent} min="0" max="100" /></div>
                  <div className="space-y-2"><Label>Due date</Label><Input name="dueDate" type="date" defaultValue={project.dueDate?.toISOString().slice(0, 10)} /></div>
                  <div className="space-y-2"><Label>Budget</Label><Input name="budget" type="number" step="0.01" defaultValue={project.budget?.toString()} /></div>
                  <Button type="submit">Save project</Button>
                </form>
              </CardContent>
            </Card>
          )}

            {user.role !== "MEMBER" && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    Team Assignment
                  </CardTitle>

                  <CardDescription>
                    Assign internal team members to this project.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  {teamMembers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No team members found.
                    </p>
                  ) : (
                    teamMembers.map((member) => {
                      const assigned =
                        project.members.some(
                          (m) =>
                            m.userId === member.id
                        );

                      return (
                        <div
                          key={member.id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div>
                            <div className="font-medium">
                              {member.name ??
                                member.email}
                            </div>

                            <div className="text-sm text-muted-foreground">
                              {member.email}
                            </div>
                          </div>

                          {assigned ? (
                            <form
                              action={unassignMember.bind(
                                null,
                                project.id,
                                member.id
                              )}
                            >
                              <Button
                                size="sm"
                                variant="destructive"
                              >
                                Remove
                              </Button>
                            </form>
                          ) : (
                            <form
                              action={assignMember.bind(
                                null,
                                project.id,
                                member.id
                              )}
                            >
                              <Button size="sm">
                                Assign
                              </Button>
                            </form>
                          )}
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            )}

            {user.role === "MEMBER" && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    Assigned Team
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    {project.members.map(
                      (member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div>
                            <div className="font-medium">
                              {member.user.name ??
                                member.user.email}
                            </div>

                            <div className="text-sm text-muted-foreground">
                              {member.user.email}
                            </div>
                          </div>

                          <Badge>
                            {member.user.role}
                          </Badge>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

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
              <CardContent className="space-y-4">
                {project.milestones.map((milestone) => (
                  <div key={milestone.id} className="flex items-start justify-between rounded-lg border bg-background/70 p-4">
                    <div><div className="font-medium">{milestone.title}</div><p className="text-sm text-muted-foreground">{milestone.description}</p><p className="mt-2 text-xs text-muted-foreground">{milestone.dueDate
  ? formatDate(milestone.dueDate)
  : "No due date"}</p></div>
                    <Badge>{milestone.status}</Badge>
                  </div>
                ))}
                {user.role !== "MEMBER" && (
                <form action={createMilestone} className="grid gap-3 rounded-lg border bg-muted/20 p-4 md:grid-cols-4">
                  <input type="hidden" name="projectId" value={project.id} />
                  <Input name="title" placeholder="Milestone title" required />
                  <Input name="dueDate" type="date" />
                  <select name="status" className="focus-ring h-9 rounded-md border bg-background px-3 text-sm"><option>PENDING</option><option>IN_PROGRESS</option><option>COMPLETED</option></select>
                  <Button type="submit">Add milestone</Button>
                </form>
)}
              </CardContent>
            </Card>




            <Card>
              <CardHeader><CardTitle>Deliverables</CardTitle></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {project.deliverables.map((deliverable) => (
                  <div key={deliverable.id} className="rounded-lg border bg-background/70 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-medium">{deliverable.title}</div>
                        <p className="mt-1 text-sm text-muted-foreground">{deliverable.description}</p>
                        {deliverable.fileName ? <a className="mt-3 block rounded-md border bg-muted/50 px-3 py-2 text-sm text-accent hover:bg-muted" href={`/api/uploads/download?deliverableId=${deliverable.id}`}>{deliverable.fileName}</a> : null}
                      </div>
                      <Badge>{deliverable.status}</Badge>
                    </div>
                    {user.role !== "CLIENT" && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <form action={approveDeliverable.bind(null, deliverable.id)}><Button size="sm" variant="outline">Approve</Button></form>
                        <form action={requestDeliverableRevision.bind(null, deliverable.id)} className="flex gap-2"><Input name="revisionNotes" placeholder="Revision notes" /><Button size="sm" variant="outline">Request revision</Button></form>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
              </div>
                <div className="space-y-6">
                  <Card className="glass-panel">
                    <CardHeader>
                      <CardTitle>
                        Client Update
                      </CardTitle>
                    </CardHeader>

                    <CardContent>
                      <Progress
                        value={project.progressPercent}
                        className="mb-4"
                      />

                      <p className="text-sm leading-6 text-muted-foreground">
                        {project.aiSummary ??
                          "Generate an update to publish a client-friendly summary in the portal."}
                      </p>
                    </CardContent>
                  </Card>

                  {user.role !== "MEMBER" && (
                    <Card>
                      <CardHeader>
                        <CardTitle>
                          Upload Deliverable
                        </CardTitle>
                      </CardHeader>

                      <CardContent>
                        <DeliverableUploader
                          projectId={project.id}
                        />
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle>
                        Project Chat
                      </CardTitle>
                    </CardHeader>

                    <CardContent>
                      <MessagesPanel
                        projectId={project.id}
                        currentUserId={user.id}
                        initialMessages={project.messages.map(
                          (message) => ({
                            ...message,
                            createdAt: message.createdAt.toISOString(),
                            attachments: (message.attachments ?? []) as Attachment[],
                          })
                        )}
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>
      </MotionPage>
    </ProviderShell>
  );
}

