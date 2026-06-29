import { ProviderShell } from "@/components/provider-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { createSubscriptionCheckoutSession, createCustomerPortalSession } from "@/services/stripe";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const user = await requireRole("ADMIN");
  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId ?? "" },
  });

  async function startPlan(formData: FormData) {
    "use server";
    const plan = formData.get("plan");
    const priceId =
      plan === "agency"
        ? process.env.STRIPE_AGENCY_PRICE_ID
        : plan === "enterprise"
        ? process.env.STRIPE_ENTERPRISE_PRICE_ID
        : process.env.STRIPE_PRO_PRICE_ID;
    if (!priceId || !user.organizationId) return;
    const session = await createSubscriptionCheckoutSession({
      organizationId: user.organizationId,
      customerEmail: user.email ?? "",
      priceId,
    });
    if (session.url) redirect(session.url);
  }

  async function openCustomerPortal() {
    "use server";
    if (!org?.stripeCustomerId) return;
    const session = await createCustomerPortalSession(org.stripeCustomerId);
    if (session.url) redirect(session.url);
  }

  const isSubscribed =
    org?.subscriptionTier && org.subscriptionTier !== "FREE";

  return (
    <ProviderShell>
      <PageHeader
        title="Billing"
        description="Manage your subscription and billing details."
      />

      {isSubscribed && org?.stripeCustomerId && (
        <div className="mb-6 flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="text-sm font-medium">
              Current plan:{" "}
              <span className="capitalize">
                {org.subscriptionTier?.toLowerCase()}
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              Manage payment methods, invoices, and cancellation via the Stripe
              portal.
            </p>
          </div>
          <form action={openCustomerPortal}>
            <Button type="submit" variant="outline">
              Manage subscription
            </Button>
          </form>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { id: "pro", label: "Pro", price: "$19/mo" },
          { id: "agency", label: "Agency", price: "$49/mo" },
          { id: "enterprise", label: "Enterprise", price: "$99/mo" },
        ].map((plan) => (
          <Card key={plan.id}>
            <CardHeader>
              <CardTitle>{plan.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{plan.price}</p>
              <p className="text-xs text-muted-foreground">
                Current tier: {org?.subscriptionTier ?? "FREE"}
              </p>
              <form action={startPlan}>
                <input type="hidden" name="plan" value={plan.id} />
                <Button
                  type="submit"
                  className="w-full"
                  variant={
                    org?.subscriptionTier?.toLowerCase() === plan.id
                      ? "outline"
                      : "default"
                  }
                  disabled={org?.subscriptionTier?.toLowerCase() === plan.id}
                >
                  {org?.subscriptionTier?.toLowerCase() === plan.id
                    ? "Current plan"
                    : "Upgrade"}
                </Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
    </ProviderShell>
  );
}