import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertProjectAccess } from "@/lib/permissions";
import { z } from "zod";

const milstonePatchSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "APPROVED"]).optional(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const milestone = await prisma.milestone.findUnique({ where: { id } });
  if (!milestone) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { user } = await assertProjectAccess(milestone.projectId);

  const parsed = milstonePatchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;

  // Clients may only set status to APPROVED
  if (user.role === "CLIENT") {
    if (Object.keys(payload).some((k) => k !== "status") || payload.status !== "APPROVED") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const updated = await prisma.milestone.update({
    where: { id },
    data: {
      ...( payload.title !== undefined && { title: payload.title }),
      ...( payload.description !== undefined && { description: payload.description }),
      ...( payload.dueDate !== undefined && { dueDate: new Date(payload.dueDate) }),
      ...( payload.status !== undefined && { status: payload.status }),
      ...( payload.sortOrder !== undefined && { sortOrder: payload.sortOrder }),
    },
  });

  return NextResponse.json(updated);
}
