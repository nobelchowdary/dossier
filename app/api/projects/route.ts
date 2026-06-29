import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProviderUser } from "@/lib/permissions";
import { projectSchema } from "@/lib/validators";

export async function GET(req: Request) {
  const user = await requireProviderUser();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;

  const projects = await prisma.project.findMany({
    where: {
      organizationId: user.organizationId ?? "",
      status: status as never,
      members: user.role === "MEMBER" ? { some: { userId: user.id } } : undefined
    },
    include: { client: true, milestones: true },
    orderBy: { updatedAt: "desc" }
  });

  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const user = await requireProviderUser();
  const payload = projectSchema.parse(await req.json());
  const project = await prisma.project.create({
    data: {
      organizationId: user.organizationId ?? "",
      clientId: payload.clientId,
      name: payload.name,
      description: payload.description,
      status: payload.status,
      progressPercent: payload.progressPercent,
      startDate: payload.startDate ? new Date(payload.startDate) : null,
      dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
      budget: payload.budget ? payload.budget.toString() : undefined,
      members: { create: { userId: user.id } }
    }
  });
  return NextResponse.json(project, { status: 201 });
}
