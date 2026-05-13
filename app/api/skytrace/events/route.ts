import { NextResponse } from "next/server";
import { normalizeSkyTraceLocalEvent, validateSkyTraceLocalEvent } from "@/lib/skytrace-api";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const validation = validateSkyTraceLocalEvent(payload);

  if (!validation.ok) {
    return NextResponse.json(
      {
        ok: false,
        status: "INVALID_PAYLOAD",
        errors: validation.errors,
      },
      { status: 400 },
    );
  }

  const event = normalizeSkyTraceLocalEvent(validation.data);

  // Future integration points intentionally left local/demo-safe for now:
  // - System Events write: append this normalized event to the shared event ledger.
  // - Airtable write: upsert mission/event rows for ops reporting.
  // - n8n handoff: fan out to Telegram, dashboard sync, and audit workflows.
  return NextResponse.json({
    ok: true,
    event,
  });
}
