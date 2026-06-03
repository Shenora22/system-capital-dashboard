import { NextResponse } from "next/server";
import {
  mapSkyTraceEventToSystemEvent,
  normalizeSkyTraceLocalEvent,
  validateSkyTraceLocalEvent,
} from "@/lib/skytrace-api";
import {
  persistSkyTraceEvent,
  SkyTracePersistenceConfigError,
  skyTraceEventsTableName,
} from "@/integrations/supabase/skytrace-events";

export const dynamic = "force-dynamic";

const skyTraceIngestApiKeyHeader = "x-skytrace-api-key";
const skyTraceAppRequestHeader = "x-skytrace-app-request";

function isSameOriginSkyTraceAppRequest(request: Request) {
  const origin = request.headers.get("origin");
  const appRequest = request.headers.get(skyTraceAppRequestHeader);

  if (!origin || appRequest !== "skytrace-ui") return false;

  const requestUrl = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const protocol = forwardedProto ?? requestUrl.protocol.replace(/:$/, "");
  const allowedOrigins = new Set([requestUrl.origin]);

  if (host) allowedOrigins.add(`${protocol}://${host}`);

  return allowedOrigins.has(origin);
}

function isSkyTraceIngestAuthorized(request: Request) {
  const configuredApiKey = process.env.SKYTRACE_INGEST_API_KEY;
  const providedApiKey = request.headers.get(skyTraceIngestApiKeyHeader);

  return Boolean(
    (configuredApiKey && providedApiKey && providedApiKey === configuredApiKey) ||
      isSameOriginSkyTraceAppRequest(request),
  );
}

export async function POST(request: Request) {
  if (!isSkyTraceIngestAuthorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        status: "UNAUTHORIZED",
      },
      { status: 401 },
    );
  }

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
  const systemEventPreview = mapSkyTraceEventToSystemEvent(event);

  try {
    const persistence = await persistSkyTraceEvent({
      event,
      systemEventPreview,
    });

    return NextResponse.json({
      ok: true,
      event,
      systemEventPreview,
      persistence,
      row: persistence.row,
    });
  } catch (error) {
    console.error("[skytrace/events] Failed to persist event:", error);

    if (error instanceof SkyTracePersistenceConfigError) {
      return NextResponse.json(
        {
          ok: false,
          status: "PERSISTENCE_NOT_CONFIGURED",
          message:
            "SkyTrace event validation succeeded, but Supabase server persistence is not configured.",
          requiredEnv: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
          requiredTable: skyTraceEventsTableName,
          event,
          systemEventPreview,
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        status: "PERSISTENCE_FAILED",
        message:
          "SkyTrace event validation succeeded, but persistence failed. Confirm Supabase env vars and the skytrace_events table.",
        requiredTable: skyTraceEventsTableName,
        event,
        systemEventPreview,
      },
      { status: 500 },
    );
  }
}
