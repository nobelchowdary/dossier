"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { canManageInvoices, requireRole } from "@/lib/permissions";
import { invoiceSchema } from "@/lib/validators";
import { logActivity } from "@/services/activity";
import { createInvoiceCheckoutSession } from "@/services/stripe";

export async function createInvoice(formData: FormData) {
  const user = await requireRole("ADMIN");
  if (!canManageInvoices(user.role) || !user.organizationId) {
    throw new Error("Forbidden");
  }

  const data = invoiceSchema.parse(Object.fromEntries(formData));

  const project = await prisma.project.findUnique({
    where: { id: data.projectId, organizationId: user.organizationId },
    include: { client: true },
  });
  if (!project || project.clientId !== data.clientId) {
    throw new Error("Project not found");
  }

  // Compute total from line items
  const amount = data.lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  const invoice = await prisma.invoice.create({
    data: {
      organizationId: user.organizationId,
      projectId: data.projectId,
      clientId: data.clientId,
      invoiceNumber: data.invoiceNumber,
      amount: amount.toString(),
      currency: data.currency.toLowerCase(),
      lineItems: data.lineItems,
      notes: data.notes ?? null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    },
  });

  await logActivity({
    organizationId: user.organizationId,
    actorId: user.id,
    projectId: project.id,
    action: "invoice.created",
    targetType: "Invoice",
    targetId: invoice.id,
    metadata: { invoiceNumber: invoice.invoiceNumber, amount },
  });

  revalidatePath("/invoices");
  redirect(`/invoices/${invoice.id}`);
}

export async function sendInvoice(id: string) {
  const user = await requireRole("ADMIN");
  if (!user.organizationId) throw new Error("Forbidden");

  const invoice = await prisma.invoice.findUnique({
    where: { id, organizationId: user.organizationId },
    include: { client: true, project: true },
  });
  if (!invoice) throw new Error("Invoice not found");

  const session = await createInvoiceCheckoutSession({
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    customerEmail: invoice.client.contactEmail,
    amount: Number(invoice.amount),
    currency: invoice.currency,
    description: invoice.project.name,
  });

  await prisma.invoice.update({
    where: { id },
    data: {
      status: "SENT",
      stripeCheckoutSessionId: session.id,
    },
  });

  await logActivity({
    organizationId: invoice.organizationId,
    actorId: user.id,
    projectId: invoice.projectId,
    action: "invoice.sent",
    targetType: "Invoice",
    targetId: invoice.id,
  });

  revalidatePath(`/invoices/${id}`);
}