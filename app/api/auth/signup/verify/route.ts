import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { workspaceName, ownerName, email, otp, password } = await req.json();

    if (!workspaceName || !ownerName || !email || !otp) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    const otpRecord = await prisma.loginOTP.findFirst({
      where: {
        email,
        code: otp,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "Email already registered" },
        { status: 400 }
      );
    }

    const slug =
      workspaceName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-") +
      "-" +
      Date.now();

    const organization = await prisma.organization.create({
      data: { name: workspaceName, slug },
    });

    const hashedPassword = password
      ? await bcrypt.hash(password, 12)
      : null;

    const user = await prisma.user.create({
      data: {
        name: ownerName,
        email,
        password: hashedPassword,
        role: "OWNER",
        organizationId: organization.id,
      },
    });

    await prisma.loginOTP.delete({
      where: { id: otpRecord.id },
    });

    return NextResponse.json({
      success: true,
      redirectTo: "/onboarding",
      userId: user.id,
      organizationId: organization.id,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
