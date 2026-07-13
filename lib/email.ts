import "server-only";
import { Resend } from "resend";
import { env } from "@/lib/env";
import { copy } from "@/lib/copy";
import { AcceptanceEmail } from "@/emails/acceptance";

/**
 * Sends the acceptance email. Returns false (never throws) if Resend isn't
 * configured — approval still succeeds and the admin can copy the claim link
 * manually or resend later.
 */
export async function sendAcceptanceEmail(params: {
  to: string;
  fellowNumber: number;
  claimUrl: string;
}): Promise<boolean> {
  const key = env.resendApiKey;
  if (!key) {
    console.warn("[email] RESEND_API_KEY not set — skipping acceptance email");
    return false;
  }
  try {
    const resend = new Resend(key);
    await resend.emails.send({
      from: env.emailFrom,
      to: params.to,
      subject: copy.email.subject,
      react: AcceptanceEmail({
        fellowNumber: params.fellowNumber,
        claimUrl: params.claimUrl,
      }),
    });
    return true;
  } catch (err) {
    console.error("[email] failed to send acceptance email", err);
    return false;
  }
}

export function claimUrl(token: string): string {
  return `${env.appUrl.replace(/\/$/, "")}/claim/${token}`;
}

/** Link straight to the passport home (self-serve fellows are already bound). */
export function passportUrl(): string {
  return `${env.appUrl.replace(/\/$/, "")}/passport`;
}
