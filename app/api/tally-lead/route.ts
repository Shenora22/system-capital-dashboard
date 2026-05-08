import { logAgentEvent } from "@/logging/agentLogs";

export const runtime = "nodejs";

type TallyField = {
  key?: string;
  label?: string;
  title?: string;
  name?: string;
  value?: unknown;
  answer?: unknown;
};

type TallyPayload = {
  name?: unknown;
  email?: unknown;
  business?: unknown;
  package?: unknown;
  source?: unknown;
  data?: {
    fields?: TallyField[];
  };
  fields?: TallyField[];
  response?: {
    answers?: TallyField[];
  };
  [key: string]: unknown;
};

type Lead = {
  name: string;
  email: string;
  business: string;
  package: string;
  source: string;
  receivedAt: string;
};

type NotionPropertyConfig = {
  id: string;
  name: string;
  type: string;
};

type NotionDatabase = {
  properties: Record<string, NotionPropertyConfig>;
};

const NOTION_API_VERSION = "2022-06-28";
const LEAD_FIELDS = ["name", "email", "business", "package", "source"] as const;

const FIELD_ALIASES: Record<(typeof LEAD_FIELDS)[number], string[]> = {
  name: ["name", "full name", "your name", "contact name"],
  email: ["email", "email address", "work email"],
  business: ["business", "business name", "company", "company name", "organization"],
  package: ["package", "plan", "tier", "service package", "selected package"],
  source: ["source", "lead source", "referral source", "how did you hear about us"],
};

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function stringifyValue(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  if (Array.isArray(value)) {
    return value.map(stringifyValue).filter(Boolean).join(", ");
  }

  if (typeof value === "object") {
    const maybeOption = value as { label?: unknown; name?: unknown; value?: unknown; text?: unknown };
    return stringifyValue(maybeOption.label ?? maybeOption.name ?? maybeOption.value ?? maybeOption.text ?? JSON.stringify(value));
  }

  return String(value).trim();
}

function extractFields(payload: TallyPayload) {
  const fields = new Map<string, string>();

  for (const fieldName of LEAD_FIELDS) {
    const value = stringifyValue(payload[fieldName]);
    if (value) {
      fields.set(fieldName, value);
    }
  }

  const tallyFields = [
    ...(payload.data?.fields ?? []),
    ...(payload.fields ?? []),
    ...(payload.response?.answers ?? []),
  ];

  for (const field of tallyFields) {
    const rawKey = stringifyValue(field.key ?? field.label ?? field.title ?? field.name);
    const value = stringifyValue(field.value ?? field.answer);
    if (!rawKey || !value) {
      continue;
    }

    const normalized = normalizeKey(rawKey);
    const matchedField = LEAD_FIELDS.find((leadField) =>
      FIELD_ALIASES[leadField].some((alias) => normalizeKey(alias) === normalized),
    );
    if (matchedField) {
      fields.set(matchedField, value);
    }
  }

  return fields;
}

function normalizeLead(payload: TallyPayload): Lead {
  const fields = extractFields(payload);

  return {
    name: fields.get("name") || "Unknown",
    email: (fields.get("email") || "").toLowerCase(),
    business: fields.get("business") || "Unknown",
    package: fields.get("package") || "Unknown",
    source: fields.get("source") || "Tally",
    receivedAt: new Date().toISOString(),
  };
}

function findProperty(database: NotionDatabase, preferredName: string) {
  const normalizedPreferred = normalizeKey(preferredName);

  return Object.values(database.properties).find((property) => normalizeKey(property.name) === normalizedPreferred);
}

function textProperty(type: string, value: string) {
  switch (type) {
    case "title":
      return { title: [{ text: { content: value } }] };
    case "rich_text":
      return { rich_text: [{ text: { content: value } }] };
    case "email":
      return { email: value || null };
    case "select":
      return { select: value ? { name: value } : null };
    case "multi_select":
      return { multi_select: value ? [{ name: value }] : [] };
    case "url":
      return { url: value || null };
    case "phone_number":
      return { phone_number: value || null };
    default:
      return undefined;
  }
}

function dateProperty(type: string, value: string) {
  if (type === "date") {
    return { date: { start: value } };
  }

  if (type === "created_time") {
    return undefined;
  }

  return textProperty(type, value);
}

function buildNotionProperties(database: NotionDatabase, lead: Lead) {
  const propertyInput: Record<string, unknown> = {};
  const mapping: Array<[keyof Lead, string]> = [
    ["name", "Name"],
    ["email", "Email"],
    ["business", "Business"],
    ["package", "Package"],
    ["source", "Source"],
    ["receivedAt", "Received At"],
  ];

  for (const [leadField, notionName] of mapping) {
    const property = findProperty(database, notionName);
    if (!property) {
      continue;
    }

    const value = lead[leadField];
    const notionValue = leadField === "receivedAt"
      ? dateProperty(property.type, value)
      : textProperty(property.type, value);
    if (notionValue) {
      propertyInput[property.name] = notionValue;
    }
  }

  if (!Object.values(database.properties).some((property) => property.type === "title" && propertyInput[property.name])) {
    const titleProperty = Object.values(database.properties).find((property) => property.type === "title");
    if (titleProperty) {
      propertyInput[titleProperty.name] = textProperty("title", lead.name);
    }
  }

  return propertyInput;
}

async function notionFetch<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`https://api.notion.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_API_VERSION,
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Notion API error ${response.status}: ${errorBody}`);
  }

  return response.json() as Promise<T>;
}

async function writeLeadToNotion(lead: Lead, token: string, databaseId: string) {
  const database = await notionFetch<NotionDatabase>(`/databases/${databaseId}`, token);
  const properties = buildNotionProperties(database, lead);

  return notionFetch("/pages", token, {
    method: "POST",
    body: JSON.stringify({
      parent: { database_id: databaseId },
      properties,
    }),
  });
}

export async function POST(request: Request) {
  let payload: TallyPayload;

  try {
    payload = await request.json();
  } catch {
    return Response.json(
      { success: false, error: "Invalid JSON payload." },
      { status: 400 },
    );
  }

  const lead = normalizeLead(payload);

  logAgentEvent({
    agent: "Growth Agent",
    action: "Tally lead received",
    result: `${lead.name} (${lead.email || "no email"}) from ${lead.business}`,
    status: "info",
    metadata: { lead },
  });

  if (!process.env.NOTION_TOKEN) {
    return Response.json(
      {
        success: false,
        error: "Missing NOTION_TOKEN environment variable. Add it before enabling the Tally lead webhook.",
        lead,
      },
      { status: 500 },
    );
  }

  if (!process.env.NOTION_LEADS_DATABASE_ID) {
    return Response.json(
      {
        success: false,
        error: "Missing NOTION_LEADS_DATABASE_ID environment variable. Add the target Notion leads database ID before enabling the Tally lead webhook.",
        lead,
      },
      { status: 500 },
    );
  }

  try {
    const notionPage = await writeLeadToNotion(
      lead,
      process.env.NOTION_TOKEN,
      process.env.NOTION_LEADS_DATABASE_ID,
    );

    return Response.json({
      success: true,
      lead,
      notionPage,
    });
  } catch (error) {
    console.error("[TALLY LEAD NOTION WRITE FAILED]", error);
    console.log("[TALLY LEAD FALLBACK LOCAL LOG]", lead);

    logAgentEvent({
      agent: "Growth Agent",
      action: "Tally lead Notion write failed",
      result: error instanceof Error ? error.message : "Unknown Notion write error",
      status: "error",
      metadata: { lead },
    });

    return Response.json(
      {
        success: false,
        error: "Lead received, but writing to Notion failed. The lead was logged locally as a fallback.",
        lead,
      },
      { status: 502 },
    );
  }
}
