import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { token, name } = await req.json();

    if (!token || !name?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields",
        },
        { status: 400 }
      );
    }

    const invite =
      await prisma.invite.findUnique({
        where: {
          token,
        },
      });

    if (
      !invite ||
      invite.acceptedAt ||
      invite.expiresAt < new Date()
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This invitation is invalid or has expired.",
        },
        {
          status: 400,
        }
      );
    }

    let user =
      await prisma.user.findUnique({
        where: {
          email: invite.email,
        },
      });

    if (user && !user.organizationId) {
      user = await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          organizationId:
            invite.organizationId,
          role: invite.role,
          name:
            user.name ??
            name.trim(),
        },
      });
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: invite.email,
          name: name.trim(),
          role: invite.role,
          organizationId:
            invite.organizationId,
        },
      });
    }

    const client =
      await prisma.client.findFirst({
        where: {
          contactEmail:
            invite.email,
          organizationId:
            invite.organizationId,
        },
      });

    if (client) {
      await prisma.client.update({
        where: {
          id: client.id,
        },
        data: {
          userId: user.id,
        },
      });
    }

    await prisma.invite.update({
      where: {
        id: invite.id,
      },
      data: {
        acceptedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Invitation accepted successfully.",
    });
  } catch (error) {
    console.error(
      "INVITE ACCEPT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to accept invitation.",
      },
      {
        status: 500,
      }
    );
  }
}