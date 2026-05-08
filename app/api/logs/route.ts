import { agentActivityLog } from "@/memory/data/shenora";

type NotionRichText = Array<{ plain_text?: string }>;
type NotionProperty = {
  title?: NotionRichText;
  rich_text?: NotionRichText;
  select?: { name?: string } | null;
  status?: { name?: string } | null;
  date?: { start?: string } | null;
  created_time?: string;
};

type NotionPage = {
  id: string;
  created_time?: string;
  properties?: Record<string, NotionProperty>;
};

const NOTION_VERSION = "2022-06-28";

function textFromProperty(property: NotionProperty | undefined): string {
  if (!property) {
    return "";
  }

  return (
    property.title?.map((part) => part.plain_text ?? "").join("") ||
    property.rich_text?.map((part) => part.plain_text ?? "").join("") ||
    property.select?.name ||
    property.status?.name ||
    property.date?.start ||
    property.created_time ||
    ""
  );
}

function fallbackLogs(agentFilter: string | null) {
  return agentActivityLog
    .filter((entry) => !agentFilter || entry.agent.toLowerCase() === agentFilter.toLowerCase())
    .slice(0, 50)
    .map((entry, index) => ({
      id: `fallback-${index}`,
      timestamp: entry.time,
      agent: entry.agent,
      action: entry.task,
      result: entry.result,
      status: "ok",
      source: "fallback",
    }));
}

function normalizeNotionPage(page: NotionPage) {
  const properties = page.properties ?? {};

  return {
    id: page.id,
    timestamp: textFromProperty(properties.Timestamp) || textFromProperty(properties.Time) || page.created_time || "",
    agent: textFromProperty(properties.Agent) || "Unknown Agent",
    action: textFromProperty(properties.Action) || textFromProperty(properties.Name) || "Logged activity",
    result: textFromProperty(properties.Result) || textFromProperty(properties.Summary) || "Not provided",
    status: textFromProperty(properties.Status) || "ok",
    source: "notion",
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const agentFilter = url.searchParams.get("agent");
  const notionToken = process.env.NOTION_API_KEY ?? process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_AGENT_LOGS_DATABASE_ID;

  if (!notionToken || !databaseId) {
    return Response.json({ success: true, source: "fallback", logs: fallbackLogs(agentFilter) });
  }

  const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${notionToken}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_VERSION,
    },
    body: JSON.stringify({
      page_size: 50,
      sorts: [{ timestamp: "created_time", direction: "descending" }],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    return Response.json(
      { success: false, source: "notion", message: "Failed to load Notion agent logs", detail },
      { status: 502 },
    );
  }

  const body = (await response.json()) as { results?: NotionPage[] };
  const logs = (body.results ?? [])
    .map(normalizeNotionPage)
    .filter((entry) => !agentFilter || entry.agent.toLowerCase() === agentFilter.toLowerCase());

  return Response.json({ success: true, source: "notion", logs });
}
