import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { requireRole, requireUser } from "@/lib/permissions";
import { createInvoiceCheckoutSession, createSubscriptionCheckoutSession } from "@/services/stripe";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.type === "subscription") {
      const user = await requireRole("ADMIN");
      const priceId = body.plan === "agency" ? process.env.STRIPE_AGENCY_PRICE_ID : process.env.STRIPE_PRO_PRICE_ID;
      if (!priceId) return NextResponse.json({ error: "Missing price id" }, { status: 400 });
      const session = await createSubscriptionCheckoutSession({
        organizationId: user.organizationId ?? "",
        customerEmail: user.email ?? "",
        priceId
      });
      return NextResponse.json({ url: session.url });
    }

    const user = await requireUser();
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: body.invoiceId,
        OR:
          user.role === "CLIENT"
            ? [{ client: { userId: user.id } }]
            : [{ organizationId: user.organizationId ?? "" }]
      },
      include: { client: true, project: true }
    });
    if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const session = await createInvoiceCheckoutSession({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerEmail: invoice.client.contactEmail,
      amount: Number(invoice.amount),
      currency: invoice.currency,
      description: invoice.project.name
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    return errorResponse(error);
  }
}
