import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertProjectAccess } from "@/lib/permissions";
import { messageSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const payload = messageSchema.parse(await req.json());
  const { user } = await assertProjectAccess(payload.projectId);

  const message = await prisma.message.create({
    data: {
      projectId: payload.projectId,
      senderId: user.id,
      body: payload.body,
      attachments: payload.attachments,
      readBy: [user.id],
    },
    include: { sender: true },
  });

  return NextResponse.json(message, { status: 201 });
}
