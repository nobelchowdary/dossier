"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { inviteSchema } from "@/lib/validators";
import { sendEmail } from "@/services/email";

export async function createInvite(formData: FormData) {
  const user = await requireRole("ADMIN");

  if (!user.organizationId) {
    throw new Error("Forbidden");
  }

  const data = inviteSchema.parse(Object.fromEntries(formData));

  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser && existingUser.organizationId === user.organizationId) {
    throw new Error("User already belongs to this workspace");
  }

  const existingInvite = await prisma.invite.findFirst({
    where: {
      email: data.email,
      organizationId: user.organizationId,
      acceptedAt: null,
    },
  });

  if (existingInvite) {
    throw new Error("Pending invite already exists");
  }

  const invite = await prisma.invite.create({
    data: {
      organizationId: user.organizationId,
      email: data.email,
      role: data.role,
      token: crypto.randomBytes(32).toString("hex"),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const inviteUrl = `${appUrl}/invite/${invite.token}`;

  try {
    await sendEmail({
      to: data.email,
      subject: "You're invited to join Dossier",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2>Workspace Invitation</h2>
          <p>
            You have been invited to join the workspace as
            <strong>${data.role}</strong>.
          </p>
          <p>Click the button below to accept your invitation.</p>
          <p>
            
              href="${inviteUrl}"
              style="
                background:#111827;
                color:#ffffff;
                padding:12px 20px;
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
  } catch (error) {
    console.error("EMAIL SEND ERROR:", error);
  }

  revalidatePath("/team");
  revalidatePath("/settings/team");
}