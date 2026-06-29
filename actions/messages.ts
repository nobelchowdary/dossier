"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertProjectAccess } from "@/lib/permissions";
import { messageSchema } from "@/lib/validators";
import { logActivity } from "@/services/activity";

export async function createMessage(formData: FormData) {
  const data = messageSchema.parse(Object.fromEntries(formData));
  const { user, project } = await assertProjectAccess(data.projectId);

  const message = await prisma.message.create({
    data: {
      projectId: data.projectId,
      senderId: user.id,
      body: data.body
    }
  });

  await logActivity({
    organizationId: project.organizationId,
    actorId: user.id,
    projectId: project.id,
    action: "message.created",
    targetType: "Message",
    targetId: message.id
  });

  revalidatePath(`/projects/${project.id}`);
  revalidatePath(`/portal/projects/${project.id}`);
  revalidatePath("/portal/messages");
}
