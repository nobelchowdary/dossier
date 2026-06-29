import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { invoiceSchema } from "@/lib/validators";

export async function GET() {
  const user = await requireRole("ADMIN");
  const invoices = await prisma.invoice.findMany({
    where: { organizationId: user.organizationId ?? "" },
    include: { client: true, project: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(invoices);
}

export async function POST(req: Request) {
  const user = await requireRole("ADMIN");
  const payload = invoiceSchema.parse(await req.json());

  const amount = payload.lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  const invoice = await prisma.invoice.create({
    data: {
      organizationId: user.organizationId ?? "",
      projectId: payload.projectId,
      clientId: payload.clientId,
      invoiceNumber: payload.invoiceNumber,
      amount: amount.toString(),
      currency: payload.currency,
      lineItems: payload.lineItems,
      notes: payload.notes ?? null,
      dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
    },
  });

  return NextResponse.json(invoice, { status: 201 });
}
