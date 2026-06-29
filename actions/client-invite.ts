"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { logActivity } from "@/services/activity";
import { sendEmail } from "@/services/email";

export async function inviteClient(clientId: string) {
  const user = await requireRole("ADMIN");

  const client = await prisma.client.findUnique({
    where: { id: clientId },
  });

  if (!client) {
    throw new Error("Client not found");
  }

  // Clear any existing pending invites for this email
  await prisma.invite.deleteMany({
    where: {
      email: client.contactEmail,
      role: "CLIENT",
      acceptedAt: null,
    },
  });

  const invite = await prisma.invite.create({
    data: {
      organizationId: client.organizationId,
      email: client.contactEmail,
      role: "CLIENT",
      token: crypto.randomBytes(32).toString("hex"),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const inviteUrl = `${appUrl}/invite/${invite.token}`;

  await logActivity({
    organizationId: client.organizationId,
    actorId: user.id,
    action: "client.invited",
    targetType: "Client",
    targetId: client.id,
    metadata: { email: client.contactEmail },
  });

  await sendEmail({
    to: client.contactEmail,
    subject: "You're invited to the client portal",
    html: `
      <div style="font-family: sans-serif; max-width: 600px;">
        <h2>You've been invited</h2>
        <p>You have been invited to access your client portal.</p>
        <p>Click the button below to activate your account.</p>
        <p>
          
            href="${inviteUrl}"
            style="
              background:#111827;
              color:white;
              padding:12px 18px;
              text-decoration:none;
              border-radius:6px;
              display:inline-block;
            "
          >
            Accept Invitation
          </a>
        </p>
        <p>Or copy this link: ${inviteUrl}</p>
        <p>This invitation expires in 7 days.</p>
      </div>
    `,
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
}