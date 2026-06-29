"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertProjectAccess } from "@/lib/permissions";
import { generateProjectSummary } from "@/services/claude";
import { logActivity } from "@/services/activity";

export async function generateUpdate(
  projectId: string
) {
  const { user, project } =
    await assertProjectAccess(projectId);

  if (user.role === "CLIENT") {
    throw new Error(
      "Only providers can generate updates"
    );
  }

  const [activities, messages, milestones] =
    await Promise.all([
      prisma.activityLog.findMany({
        where: {
          projectId,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 20,
      }),

      prisma.message.findMany({
        where: {
          projectId,
        },
        include: {
          sender: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 20,
      }),

      prisma.milestone.findMany({
        where: {
          projectId,
        },
        orderBy: {
          dueDate: "asc",
        },
      }),
    ]);

  const summary =
    await generateProjectSummary({
      projectName: project.name,

      activities: activities.map(
        (item) =>
          `${item.action} | ${item.targetType} | ${JSON.stringify(
            item.metadata ?? {}
          )}`
      ),

      messages: messages.map(
        (message) =>
          `${message.sender.name ?? message.sender.email}: ${
            message.body
          }`
      ),

      milestones: milestones.map(
        (milestone) =>
          `${milestone.title} | Status: ${milestone.status} | Due: ${milestone.dueDate}`
      ),
    });

  await prisma.project.update({
    where: {
      id: projectId,
    },
    data: {
      aiSummary: summary,
    },
  });

  await logActivity({
    organizationId: project.organizationId,
    actorId: user.id,
    projectId,
    action: "ai_summary.generated",
    targetType: "Project",
    targetId: projectId,
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/portal/projects/${projectId}`);

  revalidatePath("/dashboard");
  revalidatePath("/projects");
  revalidatePath("/portal");

  return;
}