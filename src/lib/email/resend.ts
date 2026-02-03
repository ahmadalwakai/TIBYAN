import { Resend } from "resend";

// Only instantiate Resend if API key is available
const resendApiKey = process.env.RESEND_API_KEY;

// Create a lazy-loaded Resend instance
let resendInstance: Resend | null = null;

function getResendClient(): Resend | null {
  if (!resendApiKey) {
    console.warn("[Email] RESEND_API_KEY not configured");
    return null;
  }
  // Log first 10 chars of API key for debugging (safe to log prefix)
  console.log("[Email] Using API key starting with:", resendApiKey.substring(0, 10) + "...");
  if (!resendInstance) {
    resendInstance = new Resend(resendApiKey);
  }
  return resendInstance;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface EmailResult {
  ok: boolean;
  data?: { id: string };
  error?: string;
}

/**
 * Send an email using Resend
 */
export async function sendEmail(params: SendEmailParams): Promise<EmailResult> {
  const { to, subject, html, from } = params;
  
  const resend = getResendClient();
  
  if (!resend) {
    console.warn("[Email] Skipping email send - Resend not configured");
    return {
      ok: false,
      error: "Email service not configured",
    };
  }
  
  // Use FROM_EMAIL from env - must be from a verified domain in Resend
  // Trim to remove any accidental whitespace/newlines
  const fromEmail = (from ?? process.env.FROM_EMAIL)?.trim();
  
  if (!fromEmail) {
    console.error("[Email] FROM_EMAIL environment variable is not set");
    return {
      ok: false,
      error: "Email sender not configured",
    };
  }
  
  console.log("[Email] Sending from:", fromEmail);
  
  try {
    const result = await resend.emails.send({
      from: `Tibyan <${fromEmail}>`,
      to,
      subject,
      html,
    });
    
    if (result.error) {
      console.error("[Email] Failed to send:", result.error);
      return {
        ok: false,
        error: result.error.message,
      };
    }
    
    return {
      ok: true,
      data: { id: result.data?.id ?? "" },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Email] Exception:", message);
    return {
      ok: false,
      error: message,
    };
  }
}

export { getResendClient as resend };
