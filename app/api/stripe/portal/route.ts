import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { createCustomerPortalSession } from "@/services/stripe";

export async function POST() {
  try {
    const user = await requireRole("ADMIN");
    const organization = await prisma.organization.findUnique({ where: { id: user.organizationId ?? "" } });
    if (!organization?.stripeCustomerId) {
      return NextResponse.json({ error: "No Stripe customer" }, { status: 400 });
    }
    const session = await createCustomerPortalSession(organization.stripeCustomerId);
    return NextResponse.json({ url: session.url });
  } catch (error) {
    return errorResponse(error);
  }
}
