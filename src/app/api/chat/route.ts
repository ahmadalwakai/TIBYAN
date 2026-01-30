import { NextRequest, NextResponse } from "next/server";

// In-memory storage (in production, use a database)
let chatSessions: {
  [sessionId: string]: {
    id: string;
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
      // Get specific session
      const session = chatSessions[sessionId];
      if (!session) {
        return NextResponse.json(
          { ok: false, error: "Session not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ ok: true, data: session });
    } else {
      // Get all sessions (for admin)
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
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      
      chatSessions[newSessionId] = {
        id: newSessionId,
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
