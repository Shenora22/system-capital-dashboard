import { NextResponse } from "next/server";
import { respondToSkyTraceApproval, validateSkyTraceApprovalRespond } from "@/lib/skytrace-api";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const validation = validateSkyTraceApprovalRespond(payload);

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

  const result = respondToSkyTraceApproval(validation.data);

  // Future n8n mapping:
  // 1. Telegram/operator callback posts the approval decision.
  // 2. IF node branches approved vs denied.
  // 3. System Events, Airtable, and dashboard-sync writes receive the normalized events below.
  return NextResponse.json({
    ok: true,
    ...result,
  });
}
