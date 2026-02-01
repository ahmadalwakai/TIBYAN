/**
 * Auth Cookie Encoding Self-Test
 * 
 * Run with: npx tsx scripts/test-auth-encoding.ts
 * 
 * Tests the cookie encoding/decoding roundtrip to ensure
 * middleware and login work correctly across browsers.
 */

interface CookieUserData {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "INSTRUCTOR" | "STUDENT" | "MEMBER" | "GUEST";
}

function encodeUserData(user: CookieUserData): string {
  return encodeURIComponent(JSON.stringify(user));
}

function decodeUserData(encoded: string): CookieUserData | null {
  try {
    const decoded = decodeURIComponent(encoded);
    const parsed = JSON.parse(decoded);
    
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof parsed.id === "string" &&
      typeof parsed.email === "string" &&
      typeof parsed.name === "string" &&
      ["ADMIN", "INSTRUCTOR", "STUDENT", "GUEST"].includes(parsed.role)
    ) {
      return parsed as CookieUserData;
    }
    return null;
  } catch {
    return null;
  }
}

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

// Test cases
const testCases: { name: string; user: CookieUserData }[] = [
  {
    name: "ASCII user",
    user: { id: "user-123", email: "test@example.com", name: "John Doe", role: "ADMIN" },
  },
  {
    name: "Arabic name",
    user: { id: "user-456", email: "ahmed@tibyan.com", name: "أحمد محمد", role: "INSTRUCTOR" },
  },
  {
    name: "Arabic email + name",
    user: { id: "user-789", email: "مستخدم@example.com", name: "عبدالله الرحمن", role: "ADMIN" },
  },
  {
    name: "Special chars in email",
    user: { id: "user-abc", email: "user+tag@example.com", name: "Test User", role: "STUDENT" },
  },
  {
    name: "Long name",
    user: { id: "user-xyz", email: "long@example.com", name: "أحمد بن محمد بن عبدالله الرحمن آل سعود", role: "GUEST" },
  },
];

// Run tests
console.log("=== Auth Cookie Encoding Tests ===\n");

let passed = 0;
let failed = 0;

for (const tc of testCases) {
  const encoded = encodeUserData(tc.user);
  const decoded = decodeUserData(encoded);
  
  const ok = decoded !== null && deepEqual(decoded, tc.user);
  
  if (ok) {
    console.log(`✓ PASS: ${tc.name}`);
    console.log(`  Encoded length: ${encoded.length} bytes`);
    passed++;
  } else {
    console.log(`✗ FAIL: ${tc.name}`);
    console.log(`  Input: ${JSON.stringify(tc.user)}`);
    console.log(`  Encoded: ${encoded}`);
    console.log(`  Decoded: ${JSON.stringify(decoded)}`);
    failed++;
  }
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);

// Middleware simulation tests
console.log("\n=== Middleware Simulation Tests ===\n");

type AuthState = "ok" | "missing-cookies" | "bad-userdata" | "bad-role";

function simulateMiddleware(authToken: string | undefined, userData: string | undefined): AuthState {
  if (!authToken || !userData) {
    return "missing-cookies";
  }
  
  const user = decodeUserData(userData);
  if (!user) {
    return "bad-userdata";
  }
  
  if (user.role !== "ADMIN") {
    return "bad-role";
  }
  
  return "ok";
}

const middlewareTests: { name: string; authToken: string | undefined; userData: string | undefined; expected: AuthState }[] = [
  {
    name: "No cookies",
    authToken: undefined,
    userData: undefined,
    expected: "missing-cookies",
  },
  {
    name: "Only auth token",
    authToken: "jwt-token-here",
    userData: undefined,
    expected: "missing-cookies",
  },
  {
    name: "Only user data",
    authToken: undefined,
    userData: encodeUserData({ id: "1", email: "a@b.com", name: "A", role: "ADMIN" }),
    expected: "missing-cookies",
  },
  {
    name: "Malformed user data",
    authToken: "jwt-token-here",
    userData: "not-valid-json",
    expected: "bad-userdata",
  },
  {
    name: "Invalid JSON in user data",
    authToken: "jwt-token-here",
    userData: encodeURIComponent("{invalid}"),
    expected: "bad-userdata",
  },
  {
    name: "Valid but wrong role (STUDENT)",
    authToken: "jwt-token-here",
    userData: encodeUserData({ id: "1", email: "a@b.com", name: "A", role: "STUDENT" }),
    expected: "bad-role",
  },
  {
    name: "Valid ADMIN",
    authToken: "jwt-token-here",
    userData: encodeUserData({ id: "1", email: "admin@test.com", name: "Admin", role: "ADMIN" }),
    expected: "ok",
  },
  {
    name: "Valid ADMIN with Arabic name",
    authToken: "jwt-token-here",
    userData: encodeUserData({ id: "1", email: "admin@test.com", name: "المسؤول", role: "ADMIN" }),
    expected: "ok",
  },
];

let mwPassed = 0;
let mwFailed = 0;

for (const tc of middlewareTests) {
  const result = simulateMiddleware(tc.authToken, tc.userData);
  const ok = result === tc.expected;
  
  if (ok) {
    console.log(`✓ PASS: ${tc.name} -> ${result}`);
    mwPassed++;
  } else {
    console.log(`✗ FAIL: ${tc.name}`);
    console.log(`  Expected: ${tc.expected}`);
    console.log(`  Got: ${result}`);
    mwFailed++;
  }
}

console.log(`\n=== Middleware Results: ${mwPassed} passed, ${mwFailed} failed ===`);

// Exit with error if any tests failed
const totalFailed = failed + mwFailed;
if (totalFailed > 0) {
  console.log(`\n❌ TOTAL: ${totalFailed} test(s) failed`);
  process.exit(1);
} else {
  console.log(`\n✅ ALL TESTS PASSED`);
  process.exit(0);
}
