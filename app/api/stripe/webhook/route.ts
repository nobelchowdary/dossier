import { NextResponse } from "next/server";
import { SubscriptionTier } from "@prisma/client";
import { AppError, errorResponse } from "@/lib/errors";
import { getStripe } from "@/services/stripe";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/services/activity";

const PRICE_TO_TIER: Record<string, SubscriptionTier> = {
  [process.env.STRIPE_PRO_PRICE_ID ?? ""]:          SubscriptionTier.PRO,
  [process.env.STRIPE_AGENCY_PRICE_ID ?? ""]:       SubscriptionTier.AGENCY,
  [process.env.STRIPE_ENTERPRISE_PRICE_ID ?? ""]:   SubscriptionTier.ENTERPRISE,
};

function resolveTier(priceId: string | undefined): SubscriptionTier {
  if (!priceId) {
    console.warn("[webhook] No priceId in event — defaulting to PRO");
    return SubscriptionTier.PRO;
  }
  const tier = PRICE_TO_TIER[priceId];
  if (!tier) {
    console.warn(`[webhook] Unknown priceId ${priceId} — defaulting to PRO`);
    return SubscriptionTier.PRO;
  }
  return tier;
}

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    const body = await req.text();
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const invoiceId = session.metadata?.invoiceId;
      const organizationId = session.metadata?.organizationId;
      const priceId = session.metadata?.priceId;

      if (invoiceId) {
        const existingInvoice = await prisma.invoice.findUnique({
          where: { id: invoiceId },
        });

        if (!existingInvoice || existingInvoice.status === "PAID") {
          return NextResponse.json({ received: true });
        }

        const invoice = await prisma.invoice.update({
          where: { id: invoiceId },
          data: {
            status: "PAID",
            paidAt: new Date(),
            stripeCheckoutSessionId: session.id,
            stripePaymentIntentId:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : undefined,
          },
        });

        await logActivity({
          organizationId: invoice.organizationId,
          projectId: invoice.projectId,
          action: "invoice.paid",
          targetType: "Invoice",
          targetId: invoice.id,
          metadata: { stripeCheckoutSessionId: session.id },
        });
      }

      if (
        organizationId &&
        typeof session.customer === "string" &&
        typeof session.subscription === "string"
      ) {
        await prisma.organization.update({
          where: { id: organizationId },
          data: {
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
            subscriptionTier: resolveTier(priceId),
          },
        });
      }

      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object;
      const priceId = subscription.items.data[0]?.price?.id;
      const customerId = subscription.customer as string;

      const org = await prisma.organization.findFirst({
        where: { stripeCustomerId: customerId },
      });

      if (org) {
        await prisma.organization.update({
          where: { id: org.id },
          data: {
            subscriptionTier: resolveTier(priceId),
            stripeSubscriptionId: subscription.id,
          },
        });
      }

      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      const customerId = subscription.customer as string;

      const org = await prisma.organization.findFirst({
        where: { stripeCustomerId: customerId },
      });

      if (org) {
        await prisma.organization.update({
          where: { id: org.id },
          data: {
            subscriptionTier: SubscriptionTier.FREE,
            stripeSubscriptionId: null,
          },
        });
      }

      break;
    }

    case "invoice.payment_failed": {
      const stripeInvoice = event.data.object;
      const customerId = stripeInvoice.customer as string;

      const org = await prisma.organization.findFirst({
        where: { stripeCustomerId: customerId },
      });

      if (org) {
        await logActivity({
          organizationId: org.id,
          action: "subscription.payment_failed",
          targetType: "Organization",
          targetId: org.id,
          metadata: {
            stripeInvoiceId: stripeInvoice.id,
            amountDue: stripeInvoice.amount_due,
            attemptCount: stripeInvoice.attempt_count,
          },
        });
      }

      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
