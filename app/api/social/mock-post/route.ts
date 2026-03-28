import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    const receivedAt = new Date().toISOString();
    console.log(`[SocialMockPost] ${receivedAt} :: ${text}`);
    return NextResponse.json({
      status: "ok",
      message: "Mock X endpoint received payload",
      echoedText: text,
      receivedAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid payload";
    console.error("[SocialMockPost] failed:", error);
    return NextResponse.json({ status: "error", message }, { status: 400 });
  }
}
