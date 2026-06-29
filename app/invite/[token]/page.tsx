import { prisma } from "@/lib/prisma";
// import { notFound } from "next/navigation";
import AcceptInviteForm from "./accept-invite-form";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const invite = await prisma.invite.findUnique({
    where: {
      token,
    },
    include: {
      organization: true,
    },
  });

  // if (
  //   !invite ||
  //   invite.acceptedAt ||
  //   invite.expiresAt < new Date()
  // ) {
  //   notFound();
  // }


  if (!invite) {
    throw new Error("Invite not found");
  }

  if (invite.acceptedAt) {
    throw new Error("Invite already accepted");
  }

  if (invite.expiresAt < new Date()) {
    throw new Error("Invite expired");
  }

  return (
    <AcceptInviteForm
      token={invite.token}
      email={invite.email}
      role={invite.role}
    />
  );
}