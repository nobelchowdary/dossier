import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type ActivityInput = {
  organizationId: string;
  action: string;
  targetType: string;
  targetId: string;
  actorId?: string | null;
  projectId?: string | null;
  metadata?: Prisma.InputJsonValue;
};

export async function logActivity(input: ActivityInput) {
  return prisma.activityLog.create({
    data: {
      organizationId: input.organizationId,
      projectId: input.projectId,
      actorId: input.actorId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      metadata: input.metadata ?? undefined
    }
  });
}
