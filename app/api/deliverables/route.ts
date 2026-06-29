import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertProjectAccess } from "@/lib/permissions";
import { deliverableSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const payload = deliverableSchema.parse(await req.json());
  const { user } = await assertProjectAccess(payload.projectId);
  if (user.role === "CLIENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const deliverable = await prisma.deliverable.create({
    data: {
      ...payload,
      milestoneId: payload.milestoneId || null,
      status: "SUBMITTED",
      submittedAt: new Date()
    }
  });
  return NextResponse.json(deliverable, { status: 201 });
}
