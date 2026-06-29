"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { logActivity } from "@/services/activity";
export async function assignMember(
  projectId: string,
  userId: string
) {
  const admin =
  await requireRole("ADMIN");

  await logActivity({
    organizationId: admin.organizationId!,
    actorId: admin.id,
    projectId,
    action: "member.assigned",
    targetType: "Project",
    targetId: projectId,
    metadata: {
        userId,
    },
    });

  await prisma.projectMember.upsert({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
    update: {},
    create: {
      projectId,
      userId,
    },
  });

  revalidatePath(
    `/projects/${projectId}`
  );
}

export async function unassignMember(
  projectId: string,
  userId: string
) {
  const admin =
  await requireRole("ADMIN");

  await logActivity({
    organizationId: admin.organizationId!,
    actorId: admin.id,
    projectId,
    action: "member.unassigned",
    targetType: "Project",
    targetId: projectId,
    metadata: {
        userId,
    },
    });

  await prisma.projectMember.deleteMany({
    where: {
      projectId,
      userId,
    },
  });

  revalidatePath(
    `/projects/${projectId}`
  );
}