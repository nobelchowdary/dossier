"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";

export async function deleteInvite(
  inviteId: string
) {
  const user = await requireRole("ADMIN");

  await prisma.invite.delete({
    where: {
      id: inviteId
    }
  });

  revalidatePath("/settings/team");
}

export async function removeMember(
  userId: string
) {
  const user = await requireRole("ADMIN");

  const member =
    await prisma.user.findUnique({
      where: {
        id: userId
      }
    });

  if (!member) {
    throw new Error(
      "Member not found"
    );
  }

  if (member.role === "OWNER") {
    throw new Error(
      "Cannot remove owner"
    );
  }

  await prisma.user.update({
    where: {
      id: userId
    },
    data: {
      organizationId: null
    }
  });

  revalidatePath("/settings/team");
}