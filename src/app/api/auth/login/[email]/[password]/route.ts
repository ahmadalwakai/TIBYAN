import { POST as loginPost } from "../../route";

/**
 * GET /api/auth/login/[email]/[password]
 * Alternative login endpoint that uses GET instead of POST
 * to bypass servers that block POST requests
 *
 * This endpoint:
 * 1. Extracts email and password from URL parameters
 * 2. Reconstructs the POST request internally
 * 3. Calls the existing login POST handler
 * 4. Returns the same response (redirect with Set-Cookie headers)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ email: string; password: string }> }
) {
  try {
    const resolvedParams = await params;
    const email = decodeURIComponent(resolvedParams.email);
    const password = decodeURIComponent(resolvedParams.password);
    const url = new URL(request.url);
    const redirect = url.searchParams.get("redirect") || "/member";

    // Reconstruct the request body as it would have been POSTed
    const body = JSON.stringify({
      email,
      password,
      redirect,
    });

    // Call the existing POST handler with a synthetic POST request
    const syntheticRequest = new Request(new URL("/api/auth/login", request.url), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Preserve original headers that might be important
        "User-Agent": request.headers.get("User-Agent") || "",
        Cookie: request.headers.get("Cookie") || "",
      },
      body,
    });

    // Call the login POST handler
    const response = await loginPost(syntheticRequest);

    if (process.env.NODE_ENV === "development") {
      console.log("[Login/GET] Alternative login via GET:", {
        email,
        status: response.status,
        headers: Array.from(response.headers.entries()),
      });
    }

    return response;
  } catch (error) {
    console.error("[Login/GET] Error:", error);
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Internal server error during login",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
