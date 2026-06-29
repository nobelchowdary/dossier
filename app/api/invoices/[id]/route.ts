import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { invoiceSchema } from "@/lib/validators";

export async function GET(
  _: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await requireRole("ADMIN");
  const { id } = await context.params;
  const invoice = await prisma.invoice.findFirst({
    where: { id, organizationId: user.organizationId ?? "" },
    include: { client: true, project: true },
  });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(invoice);
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await requireRole("ADMIN");
  const { id } = await context.params;
  const payload = invoiceSchema.partial().parse(await req.json());

  const amount =
    payload.lineItems
      ? payload.lineItems
          .reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
          .toString()
      : undefined;

  const invoice = await prisma.invoice.update({
    where: { id, organizationId: user.organizationId ?? "" },
    data: {
      ...payload,
      ...(amount !== undefined && { amount }),
      dueDate: payload.dueDate ? new Date(payload.dueDate) : undefined,
    },
  });

  return NextResponse.json(invoice);
}
