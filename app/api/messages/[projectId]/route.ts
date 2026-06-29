import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertProjectAccess } from "@/lib/permissions";

export async function GET(
  req: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await context.params;
  const { user } = await assertProjectAccess(projectId);
  const { searchParams } = new URL(req.url);
  const after = searchParams.get("after");

  const messages = await prisma.message.findMany({
    where: {
      projectId,
      ...(after ? { createdAt: { gt: new Date(after) } } : {}),
    },
    include: { sender: true },
    orderBy: { createdAt: "asc" },
  });

  // Mark fetched messages as read by this user
  const unread = messages
    .filter((m) => !m.readBy.includes(user.id))
    .map((m) => m.id);

  if (unread.length > 0) {
    await Promise.all(
      unread.map((id) =>
        prisma.message.update({
          where: { id },
          data: { readBy: { push: user.id } },
        })
      )
    );
  }

  return NextResponse.json(messages);
}
