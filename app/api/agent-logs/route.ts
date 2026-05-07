import { NextResponse } from "next/server";
import { fetchRecentAgentLogs } from "@/lib/notion-agent-logs";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? 10);

  try {
    const logs = await fetchRecentAgentLogs(Number.isFinite(limit) ? limit : 10);

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("[agent-logs] Failed to fetch Notion Agent Logs", error);

    return NextResponse.json(
      {
        logs: [],
        error: "Unable to load Agent Logs from Notion.",
      },
      { status: 500 },
    );
  }
}
