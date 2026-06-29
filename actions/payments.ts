"use server";

import { prisma } from "@/lib/prisma";

export async function markInvoicePaid(
  invoiceId: string
) {
  await prisma.invoice.update({
    where: {
      id: invoiceId,
    },
    data: {
      status: "PAID",
      paidAt: new Date(),
    },
  });
}