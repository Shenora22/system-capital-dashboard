import { NextResponse } from "next/server";
import { fetchRecentAgentLogs } from "@/integrations/supabase/notion-agent-logs";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const logs = await fetchRecentAgentLogs();
    return NextResponse.json({ logs });
  } catch (error) {
    console.error("[agent-logs] Failed to fetch logs:", error);
    return NextResponse.json({ logs: [], error: "Agent logs unavailable" }, { status: 200 });
  }
}
