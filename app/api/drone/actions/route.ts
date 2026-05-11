import { NextResponse } from "next/server";
import { automationActions, mockFleet, type AutomationActionType } from "@/lib/drone-mission";

export const dynamic = "force-dynamic";

type ActionRequest = {
  droneId?: string;
  action?: AutomationActionType;
  recommendationId?: string;
};

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as ActionRequest;
  const drone = mockFleet.find((unit) => unit.id === payload.droneId);
  const action = automationActions.find((item) => item.id === payload.action);

  if (!drone || !action) {
    return NextResponse.json(
      {
        ok: false,
        status: "rejected",
        message: "A valid droneId and review action are required.",
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    status: "staged_for_review",
    message: `${action.label} staged for ${drone.name}. No live command was sent.`,
    audit: {
      id: `audit-${Date.now()}`,
      droneId: drone.id,
      droneName: drone.name,
      action: action.id,
      recommendationId: payload.recommendationId ?? null,
      reviewRequired: true,
      createdAt: new Date().toISOString(),
    },
  });
}
