/**
 * Cookie Encoding Utilities
 * 
 * Provides safe encoding/decoding for user-data cookie
 * to prevent issues with special characters across browsers.
 */

/**
 * User data structure for cookie storage
 * Keep minimal to stay under cookie size limits (~4KB)
 */
export interface CookieUserData {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "INSTRUCTOR" | "STUDENT" | "MEMBER" | "GUEST";
}

/**
 * Encode user data for safe cookie transport
 * Uses URI encoding to handle special characters (Arabic, etc.)
 */
export function encodeUserData(userData: CookieUserData): string {
  const json = JSON.stringify(userData);
  return encodeURIComponent(json);
}

/**
 * Decode user data from cookie
 * Returns null if decoding or parsing fails
 */
export function decodeUserData(encoded: string): CookieUserData | null {
  try {
    const decoded = decodeURIComponent(encoded);
    const parsed = JSON.parse(decoded) as unknown;

    // Validate structure
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "id" in parsed &&
      "email" in parsed &&
      "name" in parsed &&
      "role" in parsed &&
      typeof (parsed as CookieUserData).id === "string" &&
      typeof (parsed as CookieUserData).email === "string" &&
      typeof (parsed as CookieUserData).name === "string" &&
      ["ADMIN", "INSTRUCTOR", "STUDENT", "MEMBER", "GUEST"].includes(
        (parsed as CookieUserData).role
      )
    ) {
      return parsed as CookieUserData;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Verify encoding/decoding roundtrip works correctly
 * Used for regression testing in development
 */
export function verifyEncodingRoundtrip(userData: CookieUserData): boolean {
  try {
    const encoded = encodeUserData(userData);
    const decoded = decodeUserData(encoded);

    if (!decoded) {
      return false;
    }

    // Verify all fields match
    return (
      decoded.id === userData.id &&
      decoded.email === userData.email &&
      decoded.name === userData.name &&
      decoded.role === userData.role
    );
  } catch {
    return false;
  }
}

/**
 * Run encoding tests with various edge cases
 * Call this in development to verify the encoding system works
 */
export function runEncodingTests(): { passed: boolean; results: string[] } {
  const results: string[] = [];
  let allPassed = true;

  const testCases: CookieUserData[] = [
    // Basic ASCII
    {
      id: "user-123",
      email: "test@example.com",
      name: "John Doe",
      role: "ADMIN",
    },
    // Arabic name
    {
      id: "user-456",
      email: "ahmed@tibyan.com",
      name: "أحمد محمد",
      role: "INSTRUCTOR",
    },
    // Special characters in email
    {
      id: "user-789",
      email: "user+tag@example.com",
      name: "Test User",
      role: "STUDENT",
    },
    // Unicode and special chars
    {
      id: "usr_abc-123",
      email: "مستخدم@example.com",
      name: "عبدالله الرحمن",
      role: "ADMIN",
    },
  ];

  for (const testCase of testCases) {
    const passed = verifyEncodingRoundtrip(testCase);
    const status = passed ? "✓ PASS" : "✗ FAIL";
    results.push(`${status}: ${testCase.name} (${testCase.email})`);

    if (!passed) {
      allPassed = false;
    }
  }

  return { passed: allPassed, results };
}

// Auto-run tests in development when module is loaded
if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
  const { passed, results } = runEncodingTests();
  console.log("[Cookie Encoding] Self-test results:");
  results.forEach((r) => console.log("  ", r));
  if (!passed) {
    console.error("[Cookie Encoding] WARNING: Some encoding tests failed!");
  }
}
