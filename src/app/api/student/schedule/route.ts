import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const authResult = await requireRole(request, "STUDENT");
  if (authResult instanceof NextResponse) return authResult;

  try {
    const userId = authResult.id;

    // Return empty schedule for now (can be extended with LiveSession model)
    return NextResponse.json({ ok: true, data: [] });
  } catch (error) {
    console.error("[Student Schedule]", error);
    return NextResponse.json({ ok: false, error: "حدث خطأ" }, { status: 500 });
  }
}
