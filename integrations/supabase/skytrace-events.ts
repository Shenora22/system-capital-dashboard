import { createClient } from "@supabase/supabase-js";
import type { SystemEvent } from "@/lib/system-events";
import type { SkyTraceEvent } from "@/lib/skytrace-workflow";

export const skyTraceEventsTableName = "skytrace_events";

export type SkyTraceEventPersistenceResult = {
  table: typeof skyTraceEventsTableName;
  eventId: string;
};

export type PersistSkyTraceEventInput = {
  event: SkyTraceEvent;
  systemEventPreview: SystemEvent;
};

export class SkyTracePersistenceConfigError extends Error {
  constructor() {
    super(
      "SkyTrace persistence requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
    this.name = "SkyTracePersistenceConfigError";
  }
}

function createSupabaseServerClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new SkyTracePersistenceConfigError();
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function mapSkyTraceEventToPersistenceRow({
  event,
  systemEventPreview,
}: PersistSkyTraceEventInput) {
  return {
    event_id: event.eventId,
    mission_id: event.missionId,
    event_type: event.type,
    source: event.source,
    severity: event.severity,
    status: event.status,
    requires_approval: event.requiresApproval,
    approved_by: event.approvedBy ?? null,
    approved_at: event.approvedAt ?? null,
    event_timestamp: event.timestamp,
    payload: event.payload,
    system_event_preview: systemEventPreview,
  };
}

export async function persistSkyTraceEvent(
  input: PersistSkyTraceEventInput,
): Promise<SkyTraceEventPersistenceResult> {
  const supabase = createSupabaseServerClient();
  const row = mapSkyTraceEventToPersistenceRow(input);
  const { error } = await supabase
    .from(skyTraceEventsTableName)
    .upsert(row, { onConflict: "event_id" });

  if (error) throw error;

  return {
    table: skyTraceEventsTableName,
    eventId: input.event.eventId,
  };
}
