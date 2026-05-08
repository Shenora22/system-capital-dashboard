import { NextResponse } from "next/server";
import { AgentLog, LogsResponse } from "@/logging/lib/agent-logs";

const NOTION_DATA_SOURCE_ID =
  process.env.NOTION_DATA_SOURCE_ID || "3584d3a5-eb0f-806d-88b8-000b106afc41";
const NOTION_TOKEN = process.env.NOTION_API_KEY || process.env.NOTION_TOKEN;
const NOTION_VERSION = "2022-06-28";
const NOTION_DATA_SOURCE_VERSION = "2025-09-03";

type NotionProperty = {
  type?: string;
  title?: { plain_text?: string }[];
  rich_text?: { plain_text?: string }[];
  select?: { name?: string } | null;
  status?: { name?: string } | null;
  date?: { start?: string; end?: string } | null;
  created_time?: string;
  last_edited_time?: string;
  number?: number;
  checkbox?: boolean;
  email?: string;
  phone_number?: string;
  url?: string;
  people?: { name?: string }[];
  multi_select?: { name?: string }[];
};

type NotionPage = {
  id: string;
  url?: string;
  created_time?: string;
  last_edited_time?: string;
  properties?: Record<string, NotionProperty>;
};

const getPropertyText = (property?: NotionProperty) => {
  if (!property) return "";

  switch (property.type) {
    case "title":
      return property.title?.map((item) => item.plain_text).filter(Boolean).join(" ") || "";
    case "rich_text":
      return property.rich_text?.map((item) => item.plain_text).filter(Boolean).join(" ") || "";
    case "select":
      return property.select?.name || "";
    case "status":
      return property.status?.name || "";
    case "date":
      return property.date?.start || "";
    case "created_time":
      return property.created_time || "";
    case "last_edited_time":
      return property.last_edited_time || "";
    case "number":
      return typeof property.number === "number" ? String(property.number) : "";
    case "checkbox":
      return property.checkbox ? "Yes" : "No";
    case "email":
      return property.email || "";
    case "phone_number":
      return property.phone_number || "";
    case "url":
      return property.url || "";
    case "people":
      return property.people?.map((person) => person.name).filter(Boolean).join(", ") || "";
    case "multi_select":
      return property.multi_select?.map((item) => item.name).filter(Boolean).join(", ") || "";
    default:
      return "";
  }
};

const findFirstText = (properties: Record<string, NotionProperty>, keys: string[]) => {
  const normalized = Object.entries(properties).map(([key, value]) => [key.toLowerCase(), value] as const);

  for (const key of keys) {
    const exact = properties[key];
    if (exact) {
      const value = getPropertyText(exact);
      if (value) return value;
    }

    const fuzzy = normalized.find(([propertyKey]) => propertyKey.includes(key.toLowerCase()));
    if (fuzzy) {
      const value = getPropertyText(fuzzy[1]);
      if (value) return value;
    }
  }

  return "";
};

const pageTitle = (properties: Record<string, NotionProperty>) => {
  const titleProperty = Object.values(properties).find((property) => property.type === "title");
  return getPropertyText(titleProperty);
};

const normalizePage = (page: NotionPage): AgentLog => {
  const properties = page.properties || {};
  const title = pageTitle(properties);
  const agent = findFirstText(properties, ["Agent", "Owner", "Worker", "Name"]) || "System Agent";
  const action =
    findFirstText(properties, ["Action", "Task", "Event", "Activity", "Log", "Name", "Title"]) ||
    title ||
    "Agent activity";
  const result = findFirstText(properties, ["Result", "Outcome", "Summary", "Detail", "Notes"]) || "Logged";
  const status = findFirstText(properties, ["Status", "State", "Stage"]) || "Logged";
  const timestamp =
    findFirstText(properties, ["Time", "Date", "Timestamp", "Created", "Last edited"]) ||
    page.created_time ||
    page.last_edited_time ||
    new Date().toISOString();

  return {
    id: page.id,
    timestamp,
    agent,
    action,
    result,
    status,
    source: "notion",
    url: page.url,
  };
};

const queryNotion = async (endpoint: string, notionVersion: string) => {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      "Content-Type": "application/json",
      "Notion-Version": notionVersion,
    },
    body: JSON.stringify({ page_size: 25 }),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.message || `Notion responded with ${response.status}`);
  }

  return payload;
};

export async function GET() {
  if (!NOTION_TOKEN) {
    return NextResponse.json<LogsResponse>(
      {
        logs: [],
        source: "not-configured",
        message: "Set NOTION_API_KEY or NOTION_TOKEN to read Agent Logs from Notion.",
        updatedAt: new Date().toISOString(),
      },
      { status: 200 },
    );
  }

  try {
    let payload;

    try {
      payload = await queryNotion(
        `https://api.notion.com/v1/data_sources/${NOTION_DATA_SOURCE_ID}/query`,
        NOTION_DATA_SOURCE_VERSION,
      );
    } catch {
      // TODO(integrations): Remove database fallback after the Notion workspace is fully migrated to data sources.
      payload = await queryNotion(
        `https://api.notion.com/v1/databases/${NOTION_DATA_SOURCE_ID}/query`,
        NOTION_VERSION,
      );
    }

    const logs = Array.isArray(payload.results) ? payload.results.map(normalizePage) : [];

    return NextResponse.json<LogsResponse>({
      logs,
      source: "notion",
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to read Notion Agent Logs.";

    return NextResponse.json<LogsResponse>(
      {
        logs: [],
        source: "error",
        message,
        updatedAt: new Date().toISOString(),
      },
      { status: 502 },
    );
  }
}
