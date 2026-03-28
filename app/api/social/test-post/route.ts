import { NextResponse } from "next/server";

const X_API_URL = process.env.X_API_URL || "https://api.twitter.com/2/tweets";
const X_BEARER_TOKEN = process.env.X_API_BEARER_TOKEN;

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ status: "error", message: "Missing tweet text" }, { status: 400 });
    }

    if (!X_BEARER_TOKEN) {
      return NextResponse.json(
        { status: "not-configured", message: "X_API_BEARER_TOKEN is not set" },
        { status: 503 }
      );
    }

    const response = await fetch(X_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${X_BEARER_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message =
        payload?.message ||
        payload?.errors?.[0]?.detail ||
        `X API responded with ${response.status}`;
      return NextResponse.json({ status: "error", message, payload }, { status: response.status });
    }

    const tweetId = payload?.data?.id || payload?.id;
    return NextResponse.json({
      status: "ok",
      message: tweetId ? `Posted to X successfully (tweet ${tweetId})` : "Posted to X successfully",
      tweetId,
      echoedText: text,
      payload,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown failure";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
