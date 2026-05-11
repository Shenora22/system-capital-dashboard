export type DroneStatus = "patrolling" | "returning" | "charging" | "maintenance" | "investigating";
export type AlertSeverity = "critical" | "high" | "medium" | "low";
export type RecommendationPriority = "immediate" | "elevated" | "watch";
export type AutomationActionType = "stage_return_home" | "notify_operator" | "create_review_ticket";

export type DroneFleetUnit = {
  id: string;
  name: string;
  model: string;
  status: DroneStatus;
  operator: string;
  mission: string;
  zone: string;
  latitude: number;
  longitude: number;
  altitudeFt: number;
  speedMph: number;
  batteryPct: number;
  signalPct: number;
  lastPing: string;
  heading: number;
  payload: string;
};

export type DroneAlert = {
  id: string;
  droneId: string;
  title: string;
  severity: AlertSeverity;
  confidence: number;
  detail: string;
  createdAt: string;
};

export type DroneRecommendation = {
  id: string;
  droneId: string;
  priority: RecommendationPriority;
  title: string;
  rationale: string;
  action: AutomationActionType;
  reviewRequired: boolean;
};

export type AutomationAction = {
  id: AutomationActionType;
  label: string;
  description: string;
};

export type DroneMissionSnapshot = {
  missionName: string;
  generatedAt: string;
  commandPost: string;
  operatingArea: string;
  fleet: DroneFleetUnit[];
  alerts: DroneAlert[];
  recommendations: DroneRecommendation[];
  automationActions: AutomationAction[];
};

const BASE_TIME = "2026-05-11T14:32:00.000Z";

export const automationActions: AutomationAction[] = [
  {
    id: "stage_return_home",
    label: "Stage return-home",
    description: "Prepare route, notify pilot, and hold for human approval.",
  },
  {
    id: "notify_operator",
    label: "Notify operator",
    description: "Send an internal review alert to the assigned operator.",
  },
  {
    id: "create_review_ticket",
    label: "Create review ticket",
    description: "Log the incident for post-mission review and audit.",
  },
];

export const mockFleet: DroneFleetUnit[] = [
  {
    id: "scout-01",
    name: "SCOUT-01",
    model: "AeroVironment Quantix Recon",
    status: "patrolling",
    operator: "Ops Lead Vega",
    mission: "Perimeter sweep",
    zone: "North pier",
    latitude: 40.7128,
    longitude: -74.006,
    altitudeFt: 420,
    speedMph: 28,
    batteryPct: 78,
    signalPct: 96,
    lastPing: "2026-05-11T14:31:42.000Z",
    heading: 48,
    payload: "EO/IR camera",
  },
  {
    id: "sentinel-04",
    name: "SENTINEL-04",
    model: "Skydio X10D",
    status: "investigating",
    operator: "Field Team Orion",
    mission: "Thermal anomaly check",
    zone: "East warehouse roof",
    latitude: 40.7181,
    longitude: -74.0009,
    altitudeFt: 365,
    speedMph: 14,
    batteryPct: 42,
    signalPct: 89,
    lastPing: "2026-05-11T14:31:57.000Z",
    heading: 116,
    payload: "Thermal + spotlight",
  },
  {
    id: "raven-12",
    name: "RAVEN-12",
    model: "DJI Matrice 350 RTK",
    status: "returning",
    operator: "Ops Lead Vega",
    mission: "Bridge approach overwatch",
    zone: "South approach",
    latitude: 40.7067,
    longitude: -74.0144,
    altitudeFt: 290,
    speedMph: 21,
    batteryPct: 18,
    signalPct: 73,
    lastPing: "2026-05-11T14:31:39.000Z",
    heading: 301,
    payload: "Zoom camera",
  },
  {
    id: "harbor-07",
    name: "HARBOR-07",
    model: "Freefly Astro",
    status: "patrolling",
    operator: "Harbor Watch",
    mission: "Waterside patrol",
    zone: "West channel",
    latitude: 40.7101,
    longitude: -74.0201,
    altitudeFt: 510,
    speedMph: 33,
    batteryPct: 64,
    signalPct: 57,
    lastPing: "2026-05-11T14:30:11.000Z",
    heading: 19,
    payload: "Multispectral camera",
  },
];

export const mockAlerts: DroneAlert[] = [
  {
    id: "alert-raven-battery",
    droneId: "raven-12",
    title: "Low battery on return corridor",
    severity: "critical",
    confidence: 94,
    detail: "RAVEN-12 is below 20% battery while still 0.8 miles from the dock.",
    createdAt: "2026-05-11T14:31:45.000Z",
  },
  {
    id: "alert-harbor-signal",
    droneId: "harbor-07",
    title: "Signal degradation near west channel",
    severity: "medium",
    confidence: 76,
    detail: "Telemetry signal dropped under 60% for two consecutive pings.",
    createdAt: "2026-05-11T14:30:24.000Z",
  },
  {
    id: "alert-sentinel-thermal",
    droneId: "sentinel-04",
    title: "Thermal anomaly requires review",
    severity: "high",
    confidence: 88,
    detail: "Heat signature detected on roofline; keep workflow review-only until operator confirms.",
    createdAt: "2026-05-11T14:31:59.000Z",
  },
];

export function buildDroneRecommendations(
  fleet: DroneFleetUnit[] = mockFleet,
  alerts: DroneAlert[] = mockAlerts,
): DroneRecommendation[] {
  return fleet.flatMap((drone) => {
    const droneAlerts = alerts.filter((alert) => alert.droneId === drone.id);
    const recommendations: DroneRecommendation[] = [];

    if (drone.batteryPct < 25) {
      recommendations.push({
        id: `rec-${drone.id}-return`,
        droneId: drone.id,
        priority: "immediate",
        title: `Review return-home plan for ${drone.name}`,
        rationale: `${drone.name} battery is ${drone.batteryPct}% with ${drone.signalPct}% signal. Stage return-home, but keep pilot approval required.`,
        action: "stage_return_home",
        reviewRequired: true,
      });
    }

    if (drone.signalPct < 65) {
      recommendations.push({
        id: `rec-${drone.id}-signal`,
        droneId: drone.id,
        priority: "elevated",
        title: `Notify ${drone.operator} about signal loss`,
        rationale: `${drone.name} telemetry signal is ${drone.signalPct}%. Operator should verify line-of-sight and handoff options.`,
        action: "notify_operator",
        reviewRequired: true,
      });
    }

    if (droneAlerts.some((alert) => alert.severity === "high" || alert.severity === "critical")) {
      recommendations.push({
        id: `rec-${drone.id}-ticket`,
        droneId: drone.id,
        priority: droneAlerts.some((alert) => alert.severity === "critical") ? "immediate" : "elevated",
        title: `Create review ticket for ${drone.name}`,
        rationale: "Open a review record with alert context, location, confidence, and assigned operator before any external escalation.",
        action: "create_review_ticket",
        reviewRequired: true,
      });
    }

    if (recommendations.length === 0 && drone.status === "patrolling") {
      recommendations.push({
        id: `rec-${drone.id}-watch`,
        droneId: drone.id,
        priority: "watch",
        title: `Continue monitoring ${drone.name}`,
        rationale: `${drone.name} is healthy with ${drone.batteryPct}% battery and ${drone.signalPct}% signal. No automation needed.`,
        action: "notify_operator",
        reviewRequired: true,
      });
    }

    return recommendations;
  });
}

export function getDroneMissionSnapshot(generatedAt = BASE_TIME): DroneMissionSnapshot {
  return {
    missionName: "System Capital SkyTrace Demo",
    generatedAt,
    commandPost: "Mission Control / NYC Harbor",
    operatingArea: "Lower Manhattan security perimeter",
    fleet: mockFleet,
    alerts: mockAlerts,
    recommendations: buildDroneRecommendations(),
    automationActions,
  };
}
