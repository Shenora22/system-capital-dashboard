const baseUrl = process.env.SKYTRACE_BASE_URL || "http://localhost:3000";
const apiKey = process.env.SKYTRACE_INGEST_API_KEY;
const timestamp = new Date().toISOString();

if (!apiKey) {
  console.error(
    "[skytrace-verify] Missing SKYTRACE_INGEST_API_KEY; refusing to post verification event.",
  );
  process.exit(1);
}

const payload = {
  missionId: `skytrace-verify-${Date.now()}`,
  type: "telemetry_anomaly",
  source: "telemetry",
  severity: "warn",
  timestamp,
  status: "acknowledged",
  requiresApproval: false,
  payload: {
    droneId: "verify-drone-001",
    message: "Verification event for SkyTrace persistence path.",
  },
};

const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/skytrace/events`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-skytrace-api-key": apiKey,
  },
  body: JSON.stringify(payload),
});

const result = await response.json().catch(() => ({}));

if (!response.ok || !result.ok) {
  console.error("[skytrace-verify] Persistence verification failed.");
  console.error(JSON.stringify({ status: response.status, result }, null, 2));
  process.exit(1);
}

console.log("[skytrace-verify] SkyTrace event persisted.");
console.log(
  JSON.stringify(
    {
      eventId: result.event?.eventId,
      missionId: result.event?.missionId,
      table: result.persistence?.table,
    },
    null,
    2,
  ),
);
