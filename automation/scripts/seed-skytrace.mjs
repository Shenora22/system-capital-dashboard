import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const now = new Date();

const demoDrones = [
  {
    drone_id: "skytrace-demo-001",
    drone_name: "SkyTrace Demo 1",
    drone_status: "ACTIVE",
    latitude: 40.7128,
    longitude: -74.006,
    battery_pct: 82,
    last_ping: now.toISOString(),
  },
  {
    drone_id: "skytrace-demo-002",
    drone_name: "SkyTrace Demo 2",
    drone_status: "ACTIVE",
    latitude: 40.7212,
    longitude: -74.0018,
    battery_pct: 25,
    last_ping: new Date(now.getTime() - 2 * 60 * 1000).toISOString(),
  },
  {
    drone_id: "skytrace-demo-003",
    drone_name: "SkyTrace Demo 3",
    drone_status: "CHECK_IN_PENDING",
    latitude: 40.7061,
    longitude: -74.0124,
    battery_pct: 15,
    last_ping: new Date(now.getTime() - 11 * 60 * 1000).toISOString(),
  },
];

async function seedSkyTrace() {
  const { error } = await supabase
    .from("drone_latest_location")
    .upsert(demoDrones, { onConflict: "drone_id" });

  if (error) {
    console.error("SkyTrace seed failed:", error.message);
    process.exit(1);
  }

  console.log(`Seeded ${demoDrones.length} SkyTrace demo drones.`);
}

seedSkyTrace();
