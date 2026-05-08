export type AgentLogEntry = {
  id: string;
  timestamp: string;
  agent: string;
  action: string;
  result: string;
  status: string;
  sourceUrl?: string;
};

type NotionRichText = {
  plain_text?: string;
};

type NotionProperty = {
  type?: string;
  title?: NotionRichText[];
  rich_text?: NotionRichText[];
  select?: { name?: string } | null;
  status?: { name?: string } | null;
  date?: { start?: string; end?: string } | null;
  created_time?: string;
  last_edited_time?: string;
  formula?: {
    type?: string;
    string?: string | null;
    number?: number | null;
    boolean?: boolean | null;
    date?: { start?: string } | null;
  };
  rollup?: {
    type?: string;
    number?: number | null;
    array?: NotionProperty[];
  };
  number?: number | null;
  checkbox?: boolean;
  url?: string | null;
  email?: string | null;
  phone_number?: string | null;
  multi_select?: { name?: string }[];
};

type NotionPage = {
  id: string;
  url?: string;
  created_time?: string;
  last_edited_time?: string;
  properties?: Record<string, NotionProperty>;
};

type NotionQueryResponse = {
  results?: NotionPage[];
};

const AGENT_LOGS_DATA_SOURCE_ID = "3584d3a5-eb0f-806d-88b8-000b106afc41";
const NOTION_VERSION = "2025-09-03";

function firstProperty(properties: Record<string, NotionProperty>, names: string[]) {
  const entries = Object.entries(properties);

  for (const name of names) {
    const exact = properties[name];
    if (exact) return exact;

    const normalizedName = name.toLowerCase().replace(/[^a-z0-9]/g, "");
    const fuzzy = entries.find(([key]) => key.toLowerCase().replace(/[^a-z0-9]/g, "") === normalizedName);
    if (fuzzy) return fuzzy[1];
  }

  return undefined;
}

function textFromProperty(property?: NotionProperty) {
  if (!property) return "";

  if (property.title) return property.title.map((item) => item.plain_text ?? "").join("").trim();
  if (property.rich_text) return property.rich_text.map((item) => item.plain_text ?? "").join("").trim();
  if (property.select?.name) return property.select.name;
  if (property.status?.name) return property.status.name;
  if (property.date?.start) return property.date.start;
  if (property.created_time) return property.created_time;
  if (property.last_edited_time) return property.last_edited_time;
  if (property.url) return property.url;
  if (property.email) return property.email;
  if (property.phone_number) return property.phone_number;
  if (typeof property.number === "number") return String(property.number);
  if (typeof property.checkbox === "boolean") return property.checkbox ? "Yes" : "No";
  if (property.multi_select?.length) return property.multi_select.map((item) => item.name).filter(Boolean).join(", ");

  if (property.formula) {
    const formula = property.formula;
    if (typeof formula.string === "string") return formula.string;
    if (typeof formula.number === "number") return String(formula.number);
    if (typeof formula.boolean === "boolean") return formula.boolean ? "Yes" : "No";
    if (formula.date?.start) return formula.date.start;
  }

  return "";
}

function dateFromProperty(property?: NotionProperty) {
  if (!property) return "";

  return property.date?.start ?? property.created_time ?? property.last_edited_time ?? property.formula?.date?.start ?? textFromProperty(property);
}

function formatTimestamp(value: string) {
  if (!value) return "Timestamp unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

function mapPageToAgentLog(page: NotionPage): AgentLogEntry {
  const properties = page.properties ?? {};
  const timestamp = dateFromProperty(firstProperty(properties, ["Timestamp", "Time", "Created", "Created Time", "Date", "Logged At"])) || page.created_time || page.last_edited_time || "";
  const agent = textFromProperty(firstProperty(properties, ["Agent", "Agent Name", "Name", "Operator"]));
  const action = textFromProperty(firstProperty(properties, ["Action", "Task", "Event", "Title", "Name", "Log"]));
  const result = textFromProperty(firstProperty(properties, ["Result", "Output", "Summary", "Details", "Detail", "Notes"]));
  const status = textFromProperty(firstProperty(properties, ["Status", "State", "Outcome"]));

  return {
    id: page.id,
    timestamp: formatTimestamp(timestamp),
    agent: agent || "System Capital Agent",
    action: action || "Agent log recorded",
    result: result || "Synced from Notion Agent Logs",
    status: status || "Logged",
    sourceUrl: page.url,
  };
}

export async function fetchRecentAgentLogs(limit = 10): Promise<AgentLogEntry[]> {
  const notionToken = process.env.NOTION_TOKEN;

  if (!notionToken) {
    // Notion is not configured — return empty log list gracefully
    return [];
  }

  const dataSourceId = process.env.NOTION_DATA_SOURCE_ID || AGENT_LOGS_DATA_SOURCE_ID;
  const response = await fetch(`https://api.notion.com/v1/data_sources/${dataSourceId}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${notionToken}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_VERSION,
    },
    body: JSON.stringify({
      page_size: Math.min(Math.max(limit, 1), 25),
      result_type: "page",
      sorts: [
        {
          timestamp: "created_time",
          direction: "descending",
        },
      ],
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Notion Agent Logs query failed (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as NotionQueryResponse;
  return (data.results ?? []).map(mapPageToAgentLog);
}
