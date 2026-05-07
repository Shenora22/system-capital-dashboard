type TallyField = {
  key?: string;
  label?: string;
  title?: string;
  name?: string;
  value?: unknown;
  answer?: unknown;
  options?: Array<{ id?: string; text?: string; label?: string; value?: string }>;
};

type PaymentNextStep = {
  type: "stripe_payment_link" | "booking_link" | "manual_follow_up";
  label: string;
  amount?: number;
  url?: string;
};

type NormalizedLead = {
  name: string;
  email: string;
  business: string;
  package: string;
  budget: string;
  need: string;
  source: string;
  status: string;
  paymentStatus: string;
  paymentNextStep: PaymentNextStep;
  receivedAt: string;
  eventType: string;
  formId?: string;
  responseId?: string;
};

const PRODUCTION_WEBHOOK_PATH = "/webhook/system-capital-lead";
const STATUS_NEW_LEAD = "New Lead";
const PAYMENT_STATUS_PENDING = "Pending";
const STRIPE_LINK_PLACEHOLDER_STARTER = "PASTE_STRIPE_LINK_STARTER_SYSTEM_49";
const STRIPE_LINK_PLACEHOLDER_PRO = "PASTE_STRIPE_LINK_PRO_FOLLOW_UP_SYSTEM_149";
const BOOKING_LINK_PLACEHOLDER = "BOOKING_LINK_PLACEHOLDER_CUSTOM_BUILD";

const PACKAGE_NEXT_STEPS: Record<string, Omit<PaymentNextStep, "url"> & { envKey: string; placeholderUrl: string }> = {
  starter: {
    type: "stripe_payment_link",
    label: "Starter System",
    amount: 49,
    envKey: "STRIPE_PAYMENT_LINK_STARTER",
    placeholderUrl: STRIPE_LINK_PLACEHOLDER_STARTER,
  },
  pro: {
    type: "stripe_payment_link",
    label: "Pro Follow-Up System",
    amount: 149,
    envKey: "STRIPE_PAYMENT_LINK_PRO",
    placeholderUrl: STRIPE_LINK_PLACEHOLDER_PRO,
  },
  custom: {
    type: "booking_link",
    label: "Custom Build",
    envKey: "CUSTOM_BUILD_BOOKING_LINK",
    placeholderUrl: BOOKING_LINK_PLACEHOLDER,
  },
};

function asString(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (Array.isArray(value)) {
    return value.map(asString).filter(Boolean).join(", ");
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return asString(record.text ?? record.label ?? record.value ?? JSON.stringify(value));
  }

  return String(value).trim();
}

function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function packageKey(value: string): keyof typeof PACKAGE_NEXT_STEPS | "unknown" {
  const normalized = normalizeKey(value);

  if (normalized.includes("starter") || normalized === "49") {
    return "starter";
  }

  if (normalized.includes("pro") || normalized.includes("followup") || normalized === "149") {
    return "pro";
  }

  if (normalized.includes("custom") || normalized.includes("build") || normalized.includes("booking")) {
    return "custom";
  }

  return "unknown";
}

function canonicalPackageName(value: string): string {
  const key = packageKey(value);
  return key === "unknown" ? value : PACKAGE_NEXT_STEPS[key].label;
}

function paymentNextStepForPackage(selectedPackage: string): PaymentNextStep {
  const key = packageKey(selectedPackage);

  if (key === "unknown") {
    return {
      type: "manual_follow_up",
      label: "Manual Follow-Up",
      url: process.env.CUSTOM_BUILD_BOOKING_LINK ?? BOOKING_LINK_PLACEHOLDER,
    };
  }

  const { envKey, placeholderUrl, ...nextStep } = PACKAGE_NEXT_STEPS[key];

  return {
    ...nextStep,
    url: process.env[envKey] ?? placeholderUrl,
  };
}

function fieldAnswer(field: TallyField): string {
  const rawValue = field.value ?? field.answer;

  if (Array.isArray(rawValue) && field.options?.length) {
    const optionMap = new Map(
      field.options.map((option) => [option.id, option.text ?? option.label ?? option.value ?? option.id ?? ""]),
    );

    return rawValue.map((value) => optionMap.get(asString(value)) ?? asString(value)).filter(Boolean).join(", ");
  }

  return asString(rawValue);
}

function extractFields(payload: Record<string, unknown>): Record<string, string> {
  const fields = (payload.data as Record<string, unknown> | undefined)?.fields ?? payload.fields;
  const normalizedFields: Record<string, string> = {};

  if (!Array.isArray(fields)) {
    return normalizedFields;
  }

  for (const field of fields as TallyField[]) {
    const answer = fieldAnswer(field);
    const aliases = [field.key, field.label, field.title, field.name].map((alias) => asString(alias)).filter(Boolean);

    for (const alias of aliases) {
      normalizedFields[normalizeKey(alias)] = answer;
    }
  }

  return normalizedFields;
}

function firstPresent(fields: Record<string, string>, aliases: string[], fallback = "Not provided"): string {
  for (const alias of aliases) {
    const value = fields[normalizeKey(alias)];
    if (value) {
      return value;
    }
  }

  return fallback;
}

function normalizeTallyLead(payload: Record<string, unknown>): NormalizedLead {
  const data = (payload.data as Record<string, unknown> | undefined) ?? {};
  const fields = {
    ...extractFields(payload),
    ...Object.fromEntries(Object.entries(payload).map(([key, value]) => [normalizeKey(key), asString(value)])),
  };

  const rawPackage = firstPresent(fields, ["package", "select package", "selected package", "plan", "offer"], "Not provided");
  const selectedPackage = canonicalPackageName(rawPackage);
  const source =
    firstPresent(fields, ["source", "utm_source", "utm source", "referral source", "form", "form name"], "") ||
    asString(data.formName) ||
    "Tally";

  return {
    name: firstPresent(fields, ["name", "full name", "full_name", "contact name"], "Unknown Lead"),
    email: firstPresent(fields, ["email", "email address", "contact email"], "").toLowerCase(),
    business: firstPresent(fields, ["business", "company", "business name", "company name"], "Not provided"),
    package: selectedPackage,
    budget: firstPresent(fields, ["budget", "monthly budget", "project budget", "estimated budget"], "Not provided"),
    need: firstPresent(fields, ["need", "primary need", "what do you need", "use case", "project need"], "Not provided"),
    source,
    status: STATUS_NEW_LEAD,
    paymentStatus: PAYMENT_STATUS_PENDING,
    paymentNextStep: paymentNextStepForPackage(selectedPackage),
    receivedAt: new Date().toISOString(),
    eventType: asString(payload.eventType ?? payload.type ?? payload.event ?? "FORM_RESPONSE"),
    formId: asString(data.formId ?? payload.formId) || undefined,
    responseId: asString(data.responseId ?? payload.responseId) || undefined,
  };
}

function n8nWebhookUrl(): string | null {
  const explicitUrl = process.env.N8N_LEAD_WEBHOOK_URL;
  const baseUrl = process.env.N8N_BASE_URL;
  const url = explicitUrl ?? (baseUrl ? `${baseUrl.replace(/\/$/, "")}${PRODUCTION_WEBHOOK_PATH}` : null);

  if (!url) {
    return null;
  }

  if (url.includes("/webhook-test")) {
    throw new Error("N8N_LEAD_WEBHOOK_URL must use the production /webhook/ path, not /webhook-test/.");
  }

  if (!url.endsWith(PRODUCTION_WEBHOOK_PATH)) {
    throw new Error(`N8N lead webhook must end with ${PRODUCTION_WEBHOOK_PATH}.`);
  }

  return url;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const lead = normalizeTallyLead(payload);
    const dryRun = new URL(request.url).searchParams.get("dryRun") === "1";

    if (lead.eventType !== "FORM_RESPONSE") {
      return Response.json(
        { success: false, message: "Ignored non-FORM_RESPONSE Tally event", eventType: lead.eventType },
        { status: 202 },
      );
    }

    if (!lead.email) {
      return Response.json({ success: false, message: "Email required", lead }, { status: 400 });
    }

    console.log("[TALLY_LEAD_RECEIVED]", lead);

    if (dryRun) {
      return Response.json({ success: true, message: "Lead captured successfully", dryRun: true, lead });
    }

    const webhookUrl = n8nWebhookUrl();

    if (!webhookUrl) {
      return Response.json(
        { success: false, message: "N8N_LEAD_WEBHOOK_URL or N8N_BASE_URL is required", lead },
        { status: 503 },
      );
    }

    const n8nResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...lead, rawPayload: payload }),
    });

    if (!n8nResponse.ok) {
      const responseText = await n8nResponse.text();
      console.error("[TALLY_LEAD_N8N_ERROR]", n8nResponse.status, responseText);

      return Response.json(
        { success: false, message: "n8n lead workflow rejected the lead", status: n8nResponse.status },
        { status: 502 },
      );
    }

    console.log("[TALLY_LEAD_FORWARDED]", { email: lead.email, webhookPath: PRODUCTION_WEBHOOK_PATH });

    return Response.json({ success: true, message: "Lead captured successfully", lead });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to capture lead";
    console.error("[TALLY_LEAD_ERROR]", error);

    return Response.json({ success: false, message }, { status: 500 });
  }
}
