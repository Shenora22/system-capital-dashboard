import { NextResponse } from "next/server";
import { getDroneMissionSnapshot } from "@/lib/drone-mission";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getDroneMissionSnapshot(new Date().toISOString()));
}
