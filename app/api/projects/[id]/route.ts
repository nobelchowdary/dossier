import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertProjectAccess } from "@/lib/permissions";
import { projectSchema } from "@/lib/validators";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const { project } = await assertProjectAccess(id);
  const hydrated = await prisma.project.findUnique({
    where: { id: project.id },
    include: {
      client: true,
      milestones: { orderBy: { sortOrder: "asc" } },
      deliverables: true,
      messages: { include: { sender: true }, orderBy: { createdAt: "desc" }, take: 50 },
      invoices: true
    }
  });
  return NextResponse.json(hydrated);
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const { user, project } = await assertProjectAccess(id);
  if (user.role === "CLIENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const payload = projectSchema.parse(await req.json());
  const updated = await prisma.project.update({
    where: { id: project.id },
    data: {
      clientId: payload.clientId,
      name: payload.name,
      description: payload.description,
      status: payload.status,
      progressPercent: payload.progressPercent,
      startDate: payload.startDate ? new Date(payload.startDate) : null,
      dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
      budget: payload.budget ? payload.budget.toString() : null
    }
  });
  return NextResponse.json(updated);
}
