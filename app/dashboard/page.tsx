import Link from "next/link";
import { ActivityCenter } from "@/components/activity-center";
import { KpiCard, MiniBarChart, TimelineRail } from "@/components/analytics";
import { MotionPage } from "@/components/motion";
import { ProviderShell } from "@/components/provider-shell";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { QuickActions } from "@/components/quick-actions";
import { requireProviderUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { CreditCard, FolderKanban, Inbox, TrendingUp, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {

  const user = await requireProviderUser();
  const organizationId = user.organizationId ?? "";
  const [clients, activeProjects, openInvoices, revenue, activity, projects, invoices, team] = await Promise.all([
    prisma.client.count({ where: { organizationId } }),
    prisma.project.count({ where: { organizationId, status: "ACTIVE" } }),
    prisma.invoice.count({ where: { organizationId, status: { in: ["SENT", "VIEWED", "OVERDUE"] } } }),
    prisma.invoice.aggregate({ where: { organizationId, status: "PAID" }, _sum: { amount: true } }),
    prisma.activityLog.findMany({
      where: { organizationId },
      include: { actor: true, project: true },
      orderBy: { createdAt: "desc" },
      take: 8
    }),
    user.role === "MEMBER"
  ? prisma.project.findMany({
      where: {
        members: {
          some: {
            userId: user.id,
          },
        },
      },
      include: {
        client: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 6,
    })
  : prisma.project.findMany({
      where: {
        organizationId,
      },
      include: {
        client: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 6,
    }),
    prisma.invoice.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" }, take: 12 }),
    user.role === "MEMBER"
  ? prisma.user.findMany({
      where: {
        id: user.id,
      },
      include: {
        assignedProjects: true,
      },
    })
  : prisma.user.findMany({
      where: {
        organizationId,
      },
      include: {
        assignedProjects: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    })
  ]);

  const paidRevenue = Number(revenue._sum.amount ?? 0);
  const atRiskProjects = projects.filter((project) => project.dueDate && project.dueDate.getTime() - Date.now() < 1000 * 60 * 60 * 24 * 7 && project.progressPercent < 80).length;
  const revenueBars = ["DRAFT", "SENT", "VIEWED", "PAID", "OVERDUE"].map((status) => ({
    label: status.slice(0, 3),
    value: invoices.filter((invoice) => invoice.status === status).reduce((sum, invoice) => sum + Number(invoice.amount), 0)
  }));
  const stats = [
    { label: "Clients", value: clients, detail: "Relationships with active portal access and project history.", icon: Users, tone: "accent" as const },
    { label: "Active projects", value: activeProjects, detail: `${atRiskProjects} project${atRiskProjects === 1 ? "" : "s"} need attention this week.`, icon: FolderKanban, tone: atRiskProjects ? "warning" as const : "success" as const },
    { label: "Open invoices", value: openInvoices, detail: "Awaiting client action through Stripe checkout.", icon: CreditCard, tone: "neutral" as const },
    { label: "Paid revenue", value: formatCurrency(paidRevenue), detail: "Recognized from invoices marked paid by webhook.", icon: TrendingUp, tone: "success" as const }
  ];

  return (
  <ProviderShell>
    <MotionPage>
      <PageHeader
        title={
          user.role === "MEMBER"
            ? "My Projects"
            : "Command Center"
        }
        description={
          user.role === "MEMBER"
            ? "Projects assigned to you."
            : "Revenue, delivery health, client activity, and team workload in one executive view."
        }
        actions={
          user.role !== "MEMBER" ? (
            <Button asChild>
              <Link href="/projects">
                New Project
              </Link>
            </Button>
          ) :null
        } 
      />

      {user.role !== "MEMBER" && (
        <div className="mb-6">
          <QuickActions />
        </div>
      )}

      {user.role !== "MEMBER" && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <KpiCard
              key={stat.label}
              {...stat}
            />
          ))}
        </div>
      )}

      {user.role !== "MEMBER" && (
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>
                Revenue Pipeline
              </CardTitle>
            </CardHeader>

            <CardContent>
              <MiniBarChart
                data={revenueBars}
              />
            </CardContent>
          </Card>

          <ActivityCenter
            items={activity}
          />
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>
              {user.role === "MEMBER"
                ? "My Assigned Projects"
                : "Project Health"}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {projects.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title={
                  user.role === "MEMBER"
                    ? "No assigned projects"
                    : "No projects yet"
                }
                description={
                  user.role === "MEMBER"
                    ? "Ask an administrator to assign you to a project."
                    : "Create a project to start tracking delivery health, milestones, files, and invoices."
                }
              />
            ) : (
              <TimelineRail
                items={projects.map(
                  (project) => ({
                    title: `${project.name} · ${project.client.companyName}`,
                    status: project.status,
                    date: project.dueDate || undefined,
                    progress:
                      project.progressPercent,
                  })
                )}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {user.role === "MEMBER"
                ? "My Workload"
                : "Team Productivity"}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {team.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border bg-background/70 p-3"
              >
                <div>
                  <div className="text-sm font-medium">
                    {member.name ??
                      member.email}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {member.role}
                  </div>
                </div>

                <Badge>
                  {
                    member.assignedProjects
                      .length
                  }{" "}
                  Assigned
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </MotionPage>
  </ProviderShell>
);
}
