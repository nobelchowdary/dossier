import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertProjectAccess } from "@/lib/permissions";
import { milestoneSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const payload = milestoneSchema.parse(await req.json());
  const { user } = await assertProjectAccess(payload.projectId);
  if (user.role === "CLIENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const milestone = await prisma.milestone.create({
    data: {
      projectId: payload.projectId,
      title: payload.title,
      description: payload.description,
      dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
      status: payload.status,
      sortOrder: payload.sortOrder
    }
  });
  return NextResponse.json(milestone, { status: 201 });
}
