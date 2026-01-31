/**
 * JWT Token Management
 * Uses jose library for secure token signing and verification
 */

import { SignJWT, jwtVerify } from "jose";
import type { JWTPayload as JoseJWTPayload } from "jose";

// Get JWT secret with production safety
function getJWTSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  
  // Validate in production
  if (process.env.NODE_ENV === "production" && !secret) {
    throw new Error("JWT_SECRET environment variable is required in production");
  }
  
  // Development fallback (NEVER use in production)
  const secretString = secret || "dev-fallback-secret-change-in-production-minimum-32-chars";
  return new TextEncoder().encode(secretString);
}

export interface JWTPayload extends JoseJWTPayload {
  userId: string;
  role: string;
}

/**
 * Sign a JWT token with user data
 * Token expires in 7 days
 */
export async function signToken(payload: { userId: string; role: string }): Promise<string> {
  const secret = getJWTSecret();
  
  return await new SignJWT({ userId: payload.userId, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

/**
 * Verify and decode a JWT token
 * Returns null if token is invalid or expired
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const secret = getJWTSecret();
    const { payload } = await jwtVerify(token, secret);
    
    // Validate required fields
    if (typeof payload.userId !== "string" || typeof payload.role !== "string") {
      return null;
    }
    
    return payload as JWTPayload;
  } catch (error) {
    // Token invalid, expired, or tampered
    return null;
  }
}
