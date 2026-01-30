import { randomBytes, createHash } from "crypto";
import { prisma } from "@/lib/db";

// Define token purpose types locally to avoid Prisma client import issues
type TokenPurpose = "EMAIL_VERIFICATION" | "PASSWORD_RESET" | "TEACHER_CONFIRMATION";

const TOKEN_EXPIRY_HOURS: Record<TokenPurpose, number> = {
  EMAIL_VERIFICATION: 24,
  PASSWORD_RESET: 1,
  TEACHER_CONFIRMATION: 48,
};

/**
 * Hash a token for secure storage
 */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Generate a secure random token
 */
function generateToken(): string {
  return randomBytes(32).toString("hex");
}

interface CreateTokenResult {
  ok: boolean;
  token?: string;
  error?: string;
}

/**
 * Create a new verification token for a user
 */
export async function createVerificationToken(
  userId: string,
  purpose: TokenPurpose
): Promise<CreateTokenResult> {
  try {
    // Invalidate any existing tokens for this user and purpose
    await prisma.verificationToken.updateMany({
      where: {
        userId,
        purpose,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });

    // Generate new token
    const rawToken = generateToken();
    const hashedToken = hashToken(rawToken);
    const expiryHours = TOKEN_EXPIRY_HOURS[purpose];
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

    // Store hashed token in database
    await prisma.verificationToken.create({
      data: {
        token: hashedToken,
        purpose,
        userId,
        expiresAt,
      },
    });

    // Return raw token (to be sent via email)
    return {
      ok: true,
      token: rawToken,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Token] Create failed:", message);
    return {
      ok: false,
      error: message,
    };
  }
}

interface VerifyTokenResult {
  ok: boolean;
  userId?: string;
  error?: string;
}

/**
 * Verify a token and return the associated user ID
 */
export async function verifyToken(
  rawToken: string,
  purpose: TokenPurpose
): Promise<VerifyTokenResult> {
  try {
    const hashedToken = hashToken(rawToken);

    const token = await prisma.verificationToken.findUnique({
      where: { token: hashedToken },
      include: { user: true },
    });

    if (!token) {
      return { ok: false, error: "الرابط غير صالح" };
    }

    if (token.purpose !== purpose) {
      return { ok: false, error: "نوع الرابط غير صحيح" };
    }

    if (token.usedAt) {
      return { ok: false, error: "تم استخدام هذا الرابط مسبقاً" };
    }

    if (token.expiresAt < new Date()) {
      return { ok: false, error: "انتهت صلاحية الرابط" };
    }

    return {
      ok: true,
      userId: token.userId,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Token] Verify failed:", message);
    return {
      ok: false,
      error: message,
    };
  }
}

/**
 * Mark a token as used
 */
export async function markTokenUsed(rawToken: string): Promise<boolean> {
  try {
    const hashedToken = hashToken(rawToken);

    await prisma.verificationToken.update({
      where: { token: hashedToken },
      data: { usedAt: new Date() },
    });

    return true;
  } catch (error) {
    console.error("[Token] Mark used failed:", error);
    return false;
  }
}

/**
 * Clean up expired tokens (can be called periodically)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  try {
    const result = await prisma.verificationToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { usedAt: { not: null } },
        ],
      },
    });
    return result.count;
  } catch (error) {
    console.error("[Token] Cleanup failed:", error);
    return 0;
  }
}
