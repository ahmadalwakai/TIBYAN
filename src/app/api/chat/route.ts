import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requireUser } from "@/lib/api-auth";

// In-memory storage (in production, use a database)
const chatSessions: {
  [sessionId: string]: {
    id: string;
    userId?: string; // Owner of the session
    userName: string;
    userEmail?: string;
    status: "active" | "waiting" | "resolved";
    messages: { id: string; text: string; sender: "user" | "support"; timestamp: string }[];
    createdAt: string;
    lastActivity: string;
  };
} = {};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (sessionId) {
      // User accessing their own session
      const authResult = await requireUser(request);
      if (authResult instanceof NextResponse) return authResult;
      
      // Get specific session
      const session = chatSessions[sessionId];
      if (!session) {
        return NextResponse.json(
          { ok: false, error: "Session not found" },
          { status: 404 }
        );
      }

      // Enforce ownership: user can only access own session, admin can access all
      if (authResult.role !== "ADMIN" && session.userId && session.userId !== authResult.id) {
        return NextResponse.json(
          { ok: false, error: "غير مصرح" },
          { status: 403 }
        );
      }

      return NextResponse.json({ ok: true, data: session });
    } else {
      // Admin-only: Get all sessions
      const authResult = await requireAdmin(request);
      if (authResult instanceof NextResponse) return authResult;
      
      const sessions = Object.values(chatSessions);
      return NextResponse.json({ ok: true, data: sessions });
    }
  } catch (error) {
    console.error("Chat GET error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch chat data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, sessionId, message, userName, userEmail } = body;

    if (action === "create") {
      // Create new chat session
      // Get userId from auth if available (guest sessions allowed)
      let userId: string | undefined;
      const authResult = await requireUser(request);
      if (!(authResult instanceof NextResponse)) {
        userId = authResult.id;
      }

      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      
      chatSessions[newSessionId] = {
        id: newSessionId,
        userId, // Store owner userId
        userName: userName || "زائر",
        userEmail: userEmail || undefined,
        status: "active",
        messages: [
          {
            id: `msg_${Date.now()}`,
            text: "مرحباً! كيف يمكنني مساعدتك اليوم؟",
            sender: "support",
            timestamp: now,
          },
        ],
        createdAt: now,
        lastActivity: now,
      };

      return NextResponse.json({
        ok: true,
        data: { sessionId: newSessionId, session: chatSessions[newSessionId] },
      });
    }

    if (action === "send") {
      // Send message
      if (!sessionId || !chatSessions[sessionId]) {
        return NextResponse.json(
          { ok: false, error: "Invalid session" },
          { status: 400 }
        );
      }

      const session = chatSessions[sessionId];
      const newMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text: message,
        sender: body.sender || "user",
        timestamp: new Date().toISOString(),
      };

      session.messages.push(newMessage);
      session.lastActivity = newMessage.timestamp;
      session.status = body.sender === "support" ? "active" : "waiting";

      return NextResponse.json({
        ok: true,
        data: { message: newMessage, session },
      });
    }

    if (action === "resolve") {
      // Resolve session
      if (!sessionId || !chatSessions[sessionId]) {
        return NextResponse.json(
          { ok: false, error: "Invalid session" },
          { status: 400 }
        );
      }

      chatSessions[sessionId].status = "resolved";
      chatSessions[sessionId].lastActivity = new Date().toISOString();

      return NextResponse.json({
        ok: true,
        data: chatSessions[sessionId],
      });
    }

    return NextResponse.json(
      { ok: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Chat POST error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to process chat action" },
      { status: 500 }
    );
  }
}
