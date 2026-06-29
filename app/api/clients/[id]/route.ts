import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { clientSchema } from "@/lib/validators";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const user = await requireRole("MEMBER");
  const { id } = await context.params;
  const client = await prisma.client.findFirst({
    where: { id, organizationId: user.organizationId ?? "" },
    include: { projects: true, invoices: true }
  });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(client);
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const user = await requireRole("ADMIN");
  const { id } = await context.params;
  const payload = clientSchema.parse(await req.json());
  const client = await prisma.client.update({
    where: { id, organizationId: user.organizationId ?? "" },
    data: payload
  });
  return NextResponse.json(client);
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const user = await requireRole("ADMIN");
  const { id } = await context.params;
  await prisma.client.delete({ where: { id, organizationId: user.organizationId ?? "" } });
  return NextResponse.json({ ok: true });
}
