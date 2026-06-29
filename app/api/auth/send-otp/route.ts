import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/services/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    const code = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    await prisma.loginOTP.deleteMany({
      where: { email },
    });

    await prisma.loginOTP.create({
      data: {
        email,
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV OTP] ${email}: ${code}`);
    }

    if (process.env.RESEND_API_KEY) {
      await sendEmail({
        to: email,
        subject: "Your Dossier Login Code",
        html: `
          <h2>Dossier Login</h2>
          <p>Your verification code is:</p>
          <h1>${code}</h1>
          <p>This code expires in 10 minutes.</p>
        `,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}
