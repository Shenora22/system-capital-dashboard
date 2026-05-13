import { NextResponse } from "next/server";
import { submitSkyTracePreflight, validateSkyTracePreflightSubmit } from "@/lib/skytrace-api";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const validation = validateSkyTracePreflightSubmit(payload);

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

  const result = submitSkyTracePreflight(validation.data);

  // Future n8n mapping:
  // 1. Webhook receives this payload.
  // 2. Function/IF nodes perform the same checklist validation.
  // 3. System Events, Airtable, Telegram, and dashboard-sync nodes consume the emitted events below.
  return NextResponse.json({
    ok: true,
    ...result,
  });
}
