import { Resend } from "resend";

let resendClient: Resend | null = null;

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY environment variable");
  }
  resendClient ??= new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  await getResend().emails.send({
    from: process.env.EMAIL_FROM ?? "noreply@dossier.app",
    to,
    subject,
    html,
  });
}