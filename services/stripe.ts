import Stripe from "stripe";
import { IntegrationConfigError } from "@/lib/errors";
import { absoluteUrl } from "@/lib/utils";

let stripeClient: Stripe | null = null;

export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new IntegrationConfigError("Stripe", ["STRIPE_SECRET_KEY"]);
  }

  stripeClient ??= new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-02-24.acacia",
    typescript: true
  });

  return stripeClient;
}

export async function createInvoiceCheckoutSession(input: {
  invoiceId: string;
  invoiceNumber: string;
  customerEmail: string;
  amount: number;
  currency: string;
  description: string;
}) {
  return getStripe().checkout.sessions.create({
    mode: "payment",
    customer_email: input.customerEmail,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: input.currency,
          unit_amount: Math.round(input.amount * 100),
          product_data: {
            name: `Invoice ${input.invoiceNumber}`,
            description: input.description
          }
        }
      }
    ],
    metadata: {
      invoiceId: input.invoiceId
    },
    success_url: absoluteUrl(`/portal/invoices?paid=${input.invoiceId}`),
    cancel_url: absoluteUrl(`/portal/invoices?cancelled=${input.invoiceId}`)
  });
}

export async function createSubscriptionCheckoutSession(input: {
  organizationId: string;
  customerEmail: string;
  priceId: string;
}) {
  return getStripe().checkout.sessions.create({
    mode: "subscription",
    customer_email: input.customerEmail,
    line_items: [{ price: input.priceId, quantity: 1 }],
    metadata: {
      organizationId: input.organizationId,
      priceId: input.priceId
    },
    success_url: absoluteUrl("/settings/billing?checkout=success"),
    cancel_url: absoluteUrl("/settings/billing?checkout=cancelled")
  });
}

export async function createCustomerPortalSession(customerId: string) {
  return getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: absoluteUrl("/settings/billing")
  });
}