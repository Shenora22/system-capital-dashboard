"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import mapboxgl from "mapbox-gl";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const INACTIVITY_THRESHOLD_MS = 5 * 60 * 1000;
const EVENT_DEDUPE_WINDOW_MS = 5 * 1000;
const FOLLOW_UPDATE_THRESHOLD_METERS = 25;
const RANDOM_MOVEMENT_DEGREES = 0.00035;
const HOME_BASE: [number, number] = [-74.006, 40.7128];
const supabase =
  SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
    : null;

if (MAPBOX_TOKEN) {
  mapboxgl.accessToken = MAPBOX_TOKEN;
}

type DroneRow = {
  drone_id: string;
  drone_name?: string;
  drone_status?: string;
  latitude: number;
  longitude: number;
  altitude?: number | null;
  battery_pct?: number | null;
  last_ping?: string;
};

type Alert = {
  id: string;
  message: string;
  type: "warning" | "info";
  timestamp: number;
};

type Recommendation = {
  id: string;
  droneId: string;
  action: "MONITOR" | "RETURN_HOME" | "CHARGE_REQUIRED" | "CHECK_IN_REQUIRED";
  reason: string;
  timestamp: number;
};

type EventLogItem = {
  id: string;
  timestamp: number;
  droneName: string;
  action: string;
  reason: string;
};

type BatteryBand = "CRITICAL" | "LOW" | "NORMAL" | "UNKNOWN";

type PreviousDroneState = {
  action: Recommendation["action"];
  batteryBand: BatteryBand;
  batteryPct: number | null;
};

const RECOMMENDATION_COLORS: Record<
  Recommendation["action"],
  { background: string; border: string; color: string }
> = {
  RETURN_HOME: {
    background: "rgba(255, 77, 77, 0.12)",
    border: "rgba(255, 77, 77, 0.35)",
    color: "#ff4d4d",
  },
  CHARGE_REQUIRED: {
    background: "rgba(250, 204, 21, 0.12)",
    border: "rgba(250, 204, 21, 0.35)",
    color: "#facc15",
  },
  CHECK_IN_REQUIRED: {
    background: "rgba(251, 146, 60, 0.12)",
    border: "rgba(251, 146, 60, 0.35)",
    color: "#fb923c",
  },
  MONITOR: {
    background: "rgba(110, 231, 255, 0.12)",
    border: "rgba(110, 231, 255, 0.35)",
    color: "#6ee7ff",
  },
};

function updateMarkerColor(marker: mapboxgl.Marker, color: string) {
  marker
    .getElement()
    .querySelectorAll<SVGPathElement>("svg path")
    .forEach((path) => {
      if (path.getAttribute("fill") !== "none") {
        path.setAttribute("fill", color);
      }

      if (path.getAttribute("stroke") !== "none") {
        path.setAttribute("stroke", color);
      }
    });
}

function updateMarkerUrgency(
  marker: mapboxgl.Marker,
  action: Recommendation["action"]
) {
  const element = marker.getElement();

  element.classList.toggle("skytrace-marker-responding", action !== "MONITOR");
  element.classList.toggle("skytrace-marker-return-home", action === "RETURN_HOME");
}

function getRecommendationAction(
  battery: number,
  lastPingTime: number,
  now: number
): Recommendation["action"] {
  const isInactive =
    !lastPingTime || now - lastPingTime > INACTIVITY_THRESHOLD_MS;

  if (battery < 35 && isInactive) return "RETURN_HOME";
  if (battery < 20) return "RETURN_HOME";
  if (battery < 35) return "CHARGE_REQUIRED";
  if (isInactive) return "CHECK_IN_REQUIRED";

  return "MONITOR";
}

function getBatteryBand(batteryPct?: number | null): BatteryBand {
  if (batteryPct === null || batteryPct === undefined) return "UNKNOWN";
  if (batteryPct < 20) return "CRITICAL";
  if (batteryPct < 35) return "LOW";

  return "NORMAL";
}

function getDistanceMeters(
  from: [number, number],
  to: [number, number]
): number {
  return new mapboxgl.LngLat(from[0], from[1]).distanceTo(
    new mapboxgl.LngLat(to[0], to[1])
  );
}

function getRandomMovementOffset(): number {
  return (Math.random() - 0.5) * RANDOM_MOVEMENT_DEGREES;
}

export default function DronePage() {
  const [droneData, setDroneData] = useState<DroneRow[]>([]);
  const [followDroneId, setFollowDroneId] = useState<string | null>(null);
  const [selectedDroneId, setSelectedDroneId] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [eventLog, setEventLog] = useState<EventLogItem[]>([]);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Record<string, mapboxgl.Marker>>({});
  const trailsRef = useRef<Record<string, [number, number][]>>({});
  const droneDataRef = useRef<DroneRow[]>([]);
  const lastFollowCenterRef = useRef<[number, number] | null>(null);
  const executedActionsRef = useRef<Set<string>>(new Set());
  const previousDroneStatesRef = useRef<Record<string, PreviousDroneState>>({});
  const lastEventTimesRef = useRef<Record<string, number>>({});

  const selectedDrone = droneData.find(
    (drone) => drone.drone_id === selectedDroneId
  );
  const followedDrone = droneData.find(
    (drone) => drone.drone_id === followDroneId
  );
  const selectedDroneName = selectedDrone
    ? selectedDrone.drone_name ?? selectedDrone.drone_id
    : null;
  const followedDroneName = followedDrone
    ? followedDrone.drone_name ?? followedDrone.drone_id
    : null;

  const flyToDrone = useCallback((drone: DroneRow, duration = 1000) => {
    if (!mapRef.current) return;

    const center: [number, number] = [
      Number(drone.longitude),
      Number(drone.latitude),
    ];

    mapRef.current.flyTo({
      center,
      zoom: 15,
      pitch: 60,
      bearing: 30,
      duration,
      essential: true,
    });

    lastFollowCenterRef.current = center;
  }, []);

  const selectAndFollowDrone = useCallback(
    (droneId: string) => {
      const drone = droneDataRef.current.find((item) => item.drone_id === droneId);

      setFollowDroneId(droneId);
      setSelectedDroneId(droneId);

      if (drone) {
        flyToDrone(drone);
      }
    },
    [flyToDrone]
  );

  useEffect(() => {
    droneDataRef.current = droneData;
  }, [droneData]);

  // 1. Load initial drone data
  useEffect(() => {
    if (!supabase) return;

    async function fetchDrones() {
      const { data, error } = await supabase
        .from("drone_latest_location")
        .select("*");

      if (error) {
        console.error("Supabase fetch error:", error);
        return;
      }

      setDroneData(data as DroneRow[]);
    }

    fetchDrones();
  }, []);

  // 2. Listen for Supabase real-time updates
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel("drone-location-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "drone_latest_location",
        },
        (payload) => {
          const updatedDrone = payload.new as DroneRow;

          setDroneData((current) => {
            const exists = current.some(
              (drone) => drone.drone_id === updatedDrone.drone_id
            );

            if (!exists) return [...current, updatedDrone];

            return current.map((drone) =>
              drone.drone_id === updatedDrone.drone_id
                ? updatedDrone
                : drone
            );
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 3. Create map once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    if (!MAPBOX_TOKEN) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [-74.006, 40.7128],
      zoom: 13,
      pitch: 45,
      bearing: -10,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    return () => {
      Object.values(markersRef.current).forEach((marker) => marker.remove());
      markersRef.current = {};
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // 4. Simulate coordinate updates every second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();

      setDroneData((current) =>
        current.map((drone, index) => {
          const simulatedBattery =
            index === 0 ? 25 : index === 1 ? 15 : drone.battery_pct;
          const simulatedLastPing =
            index === 2
              ? new Date(Date.now() - 11 * 60 * 1000).toISOString()
              : drone.last_ping;
          const lastPingTime = simulatedLastPing
            ? new Date(simulatedLastPing).getTime()
            : 0;
          const recommendationAction = getRecommendationAction(
            simulatedBattery ?? 100,
            lastPingTime,
            now
          );
          const shouldReturnHome = recommendationAction === "RETURN_HOME";
          const shouldStop = recommendationAction === "CHARGE_REQUIRED";
          const randomLongitudeOffset = getRandomMovementOffset();
          const randomLatitudeOffset = getRandomMovementOffset();
          const targetLng = shouldReturnHome
            ? HOME_BASE[0]
            : drone.longitude + randomLongitudeOffset;
          const targetLat = shouldReturnHome
            ? HOME_BASE[1]
            : drone.latitude + randomLatitudeOffset;
          const smoothing = shouldReturnHome ? 0.05 : 1;
          const nextLatitude = shouldStop
            ? drone.latitude
            : drone.latitude + (targetLat - drone.latitude) * smoothing;
          const nextLongitude = shouldStop
            ? drone.longitude
            : drone.longitude + (targetLng - drone.longitude) * smoothing;

          return {
            ...drone,
            battery_pct: simulatedBattery,
            latitude: nextLatitude,
            longitude: nextLongitude,
            last_ping: simulatedLastPing,
          };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 5. Create/move markers + draw trails + detect alerts
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    droneData.forEach((drone) => {
      const battery = drone.battery_pct ?? 100;
      const recommendationAction =
        recommendations.find(
          (recommendation) => recommendation.droneId === drone.drone_id
        )?.action ?? "MONITOR";
      const markerColor = RECOMMENDATION_COLORS[recommendationAction].color;

      if (battery < 30) {
        setAlerts((prev) => {
          const exists = prev.find(
            (alert) => alert.id === `${drone.drone_id}-low-battery`
          );

          if (exists) return prev;

          return [
            {
              id: `${drone.drone_id}-low-battery`,
              message: `${
                drone.drone_name || drone.drone_id
              } battery low (${battery}%)`,
              type: "warning",
              timestamp: Date.now(),
            },
            ...prev,
          ];
        });
      }

      const lngLat: [number, number] = [
        Number(drone.longitude),
        Number(drone.latitude),
      ];

      if (!trailsRef.current[drone.drone_id]) {
        trailsRef.current[drone.drone_id] = [];
      }

      const trail = trailsRef.current[drone.drone_id];
      trail.push(lngLat);

      if (trail.length > 30) {
        trail.shift();
      }

      let marker = markersRef.current[drone.drone_id];

      if (!marker) {
        marker = new mapboxgl.Marker({
          color: markerColor,
          scale: 0.9,
        })
          .setLngLat(lngLat)
          .addTo(map);

        marker.getElement().addEventListener("click", () => {
          selectAndFollowDrone(drone.drone_id);
        });

        const el = marker.getElement();
        el.style.transition = "transform 0.2s ease";
        updateMarkerUrgency(marker, recommendationAction);

        markersRef.current[drone.drone_id] = marker;
      } else {
        marker.setLngLat(lngLat);
        updateMarkerColor(marker, markerColor);
        updateMarkerUrgency(marker, recommendationAction);
      }

      const sourceId = `trail-${drone.drone_id}`;
      const layerId = `trail-layer-${drone.drone_id}`;

      const trailData: GeoJSON.Feature<GeoJSON.LineString> = {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: trail,
        },
      };

      const existingSource = map.getSource(sourceId) as
        | mapboxgl.GeoJSONSource
        | undefined;

      if (existingSource) {
        existingSource.setData(trailData);
      } else {
        map.addSource(sourceId, {
          type: "geojson",
          data: trailData,
        });

        map.addLayer({
          id: layerId,
          type: "line",
          source: sourceId,
          paint: {
            "line-color": battery < 30 ? "#ff4d4d" : "#6ee7ff",
            "line-width": 2,
            "line-opacity": 0.7,
          },
        });
      }

      const returnHomeSourceId = `return-home-${drone.drone_id}`;
      const returnHomeLayerId = `return-home-layer-${drone.drone_id}`;
      const returnHomeSource = map.getSource(returnHomeSourceId) as
        | mapboxgl.GeoJSONSource
        | undefined;

      if (recommendationAction === "RETURN_HOME") {
        const returnHomeData: GeoJSON.Feature<GeoJSON.LineString> = {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: [lngLat, HOME_BASE],
          },
        };

        if (returnHomeSource) {
          returnHomeSource.setData(returnHomeData);
        } else {
          map.addSource(returnHomeSourceId, {
            type: "geojson",
            data: returnHomeData,
          });

          map.addLayer({
            id: returnHomeLayerId,
            type: "line",
            source: returnHomeSourceId,
            paint: {
              "line-color": RECOMMENDATION_COLORS.RETURN_HOME.color,
              "line-width": 3,
              "line-opacity": 0.85,
              "line-dasharray": [1.5, 1],
            },
          });
        }
      } else if (returnHomeSource) {
        if (map.getLayer(returnHomeLayerId)) {
          map.removeLayer(returnHomeLayerId);
        }

        map.removeSource(returnHomeSourceId);
      }
    });
  }, [droneData, recommendations, selectAndFollowDrone]);

  // 6. Follow selected drone
  useEffect(() => {
    if (!mapRef.current || !followDroneId) {
      lastFollowCenterRef.current = null;
      return;
    }

    const droneToFollow = droneData.find(
      (drone) => drone.drone_id === followDroneId
    );

    if (!droneToFollow) return;

    const nextCenter: [number, number] = [
      Number(droneToFollow.longitude),
      Number(droneToFollow.latitude),
    ];
    const previousCenter = lastFollowCenterRef.current;
    const movedMeters = previousCenter
      ? getDistanceMeters(previousCenter, nextCenter)
      : Number.POSITIVE_INFINITY;

    if (movedMeters >= FOLLOW_UPDATE_THRESHOLD_METERS) {
      flyToDrone(droneToFollow, 900);
    }
  }, [droneData, flyToDrone, followDroneId]);

  // 7. Autonomous recommendation engine
  useEffect(() => {
    const now = Date.now();

    const nextRecommendations: Recommendation[] = droneData.map((drone) => {
      const battery = drone.battery_pct ?? 100;
      const lastPingTime = drone.last_ping
        ? new Date(drone.last_ping).getTime()
        : 0;

      const isInactive =
        !lastPingTime || now - lastPingTime > INACTIVITY_THRESHOLD_MS;

      const action = getRecommendationAction(battery, lastPingTime, now);
      let reason = `${drone.drone_name ?? drone.drone_id} operating normally`;

      if (action === "RETURN_HOME" && battery < 35 && isInactive) {
        reason = `${
          drone.drone_name ?? drone.drone_id
        } has low battery and no recent ping`;
      } else if (action === "RETURN_HOME") {
        reason = `${drone.drone_name ?? drone.drone_id} battery critically low`;
      } else if (action === "CHARGE_REQUIRED") {
        reason = `${
          drone.drone_name ?? drone.drone_id
        } battery below safe threshold`;
      } else if (action === "CHECK_IN_REQUIRED") {
        reason = `${
          drone.drone_name ?? drone.drone_id
        } has not checked in recently`;
      }

      return {
        id: `${drone.drone_id}-${action}`,
        droneId: drone.drone_id,
        action,
        reason,
        timestamp: now,
      };
    });

    const timeout = window.setTimeout(() => {
      setRecommendations(nextRecommendations);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [droneData]);

  // 8. Simulated command execution side effects
  useEffect(() => {
    recommendations.forEach((recommendation) => {
      if (recommendation.action === "MONITOR") {
        return;
      }

      const eventId = `${recommendation.droneId}-${recommendation.action}`;

      if (executedActionsRef.current.has(eventId)) {
        return;
      }

      executedActionsRef.current.add(eventId);

      console.log("ACTION EXECUTED", {
        action: recommendation.action,
        droneId: recommendation.droneId,
        command:
          recommendation.action === "RETURN_HOME"
            ? "SIMULATED_RETURN_HOME"
            : recommendation.action === "CHECK_IN_REQUIRED"
              ? "SIMULATED_CHECK_IN_REQUEST"
              : "SIMULATED_CHARGE_HOLD",
        homeBase:
          recommendation.action === "RETURN_HOME" ? HOME_BASE : undefined,
        reason: recommendation.reason,
      });
    });
  }, [recommendations]);

  // 9. Event log for battery threshold and recommendation action changes
  useEffect(() => {
    const now = Date.now();
    const nextEvents: EventLogItem[] = [];
    const addEvent = (event: EventLogItem, dedupeKey: string) => {
      const lastEventTime = lastEventTimesRef.current[dedupeKey] ?? 0;

      if (now - lastEventTime < EVENT_DEDUPE_WINDOW_MS) {
        return;
      }

      lastEventTimesRef.current[dedupeKey] = now;
      nextEvents.push(event);
    };

    droneData.forEach((drone) => {
      const recommendation = recommendations.find(
        (item) => item.droneId === drone.drone_id
      );
      const currentAction = recommendation?.action ?? "MONITOR";
      const currentBatteryBand = getBatteryBand(drone.battery_pct);
      const currentBatteryPct = drone.battery_pct ?? null;
      const previousState = previousDroneStatesRef.current[drone.drone_id];

      if (!previousState) {
        previousDroneStatesRef.current[drone.drone_id] = {
          action: currentAction,
          batteryBand: currentBatteryBand,
          batteryPct: currentBatteryPct,
        };
        return;
      }

      if (previousState.batteryBand !== currentBatteryBand) {
        const fromBattery =
          previousState.batteryPct === null
            ? "unknown"
            : `${previousState.batteryPct}%`;
        const toBattery =
          currentBatteryPct === null ? "unknown" : `${currentBatteryPct}%`;

        addEvent(
          {
            id: `${drone.drone_id}-battery-${now}`,
            timestamp: now,
            droneName: drone.drone_name ?? drone.drone_id,
            action: "BATTERY_THRESHOLD",
            reason: `Battery crossed from ${previousState.batteryBand} (${fromBattery}) to ${currentBatteryBand} (${toBattery})`,
          },
          `${drone.drone_id}-BATTERY_THRESHOLD`
        );
      }

      if (previousState.action !== currentAction) {
        addEvent(
          {
            id: `${drone.drone_id}-${currentAction}-${now}`,
            timestamp: now,
            droneName: drone.drone_name ?? drone.drone_id,
            action: currentAction,
            reason:
              recommendation?.reason ??
              `Action changed from ${previousState.action} to ${currentAction}`,
          },
          `${drone.drone_id}-${currentAction}`
        );
      }

      previousDroneStatesRef.current[drone.drone_id] = {
        action: currentAction,
        batteryBand: currentBatteryBand,
        batteryPct: currentBatteryPct,
      };
    });

    if (!nextEvents.length) return;

    const timeout = window.setTimeout(() => {
      setEventLog((current) => [...nextEvents, ...current].slice(0, 20));
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [droneData, recommendations]);

  return (
    <main
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#050a0e",
        color: "white",
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      <aside
        style={{
          width: "320px",
          background: "rgba(15, 23, 32, 0.95)",
          borderRight: "1px solid rgba(110, 231, 255, 0.1)",
          padding: "24px",
          boxSizing: "border-box",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "28px" }}>SkyTrace</h1>

        <p
          style={{
            color: "#6ee7ff",
            fontSize: "11px",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            marginTop: "8px",
          }}
        >
          Real-Time Drone Intelligence
        </p>

        <div style={{ marginTop: "24px", color: "#94a3b8", fontSize: "14px" }}>
          {droneData.length} drone{droneData.length === 1 ? "" : "s"} online
        </div>

        <div style={{ marginTop: "20px" }}>
          {droneData.map((drone) => {
            const isLow = (drone.battery_pct ?? 100) < 30;
            const isSelected = selectedDroneId === drone.drone_id;

            return (
              <div
                key={drone.drone_id}
                onClick={() => {
                  selectAndFollowDrone(drone.drone_id);
                }}
                style={{
                  padding: "14px",
                  borderRadius: "12px",
                  marginBottom: "12px",
                  cursor: "pointer",
                  background: isSelected
                    ? "rgba(110, 231, 255, 0.12)"
                    : "rgba(255,255,255,0.03)",
                  border: isSelected
                    ? "1px solid rgba(110, 231, 255, 0.45)"
                    : "1px solid rgba(110, 231, 255, 0.1)",
                }}
              >
                <div style={{ fontWeight: 700 }}>
                  {drone.drone_name ?? "Drone"}
                </div>

                <div
                  style={{
                    marginTop: "6px",
                    fontSize: "13px",
                    color: isLow ? "#ff4d4d" : "#94a3b8",
                  }}
                >
                  Battery:{" "}
                  {drone.battery_pct === null || drone.battery_pct === undefined
                    ? "N/A"
                    : `${drone.battery_pct}%`}
                </div>

                <div
                  style={{
                    fontSize: "12px",
                    marginTop: "6px",
                    color: isLow ? "#ff4d4d" : "#6ee7ff",
                    fontWeight: 700,
                  }}
                >
                  {isLow ? "LOW BATTERY" : "ACTIVE"}
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: "24px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(110, 231, 255, 0.1)",
            borderRadius: "12px",
            padding: "14px",
          }}
        >
          <h3 style={{ marginTop: 0, fontSize: "15px" }}>Alerts</h3>

          {alerts.length === 0 && (
            <p style={{ color: "#94a3b8", fontSize: "13px" }}>
              No active alerts
            </p>
          )}

          {alerts.map((alert) => (
            <div
              key={alert.id}
              style={{
                background:
                  alert.type === "warning"
                    ? "rgba(255, 77, 77, 0.12)"
                    : "rgba(110, 231, 255, 0.12)",
                color: alert.type === "warning" ? "#ff4d4d" : "#6ee7ff",
                padding: "10px",
                borderRadius: "8px",
                marginBottom: "8px",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              ⚠️ {alert.message}
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: "24px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(110, 231, 255, 0.1)",
            borderRadius: "12px",
            padding: "14px",
          }}
        >
          <h3 style={{ marginTop: 0, fontSize: "15px" }}>
            Recommendations
          </h3>

          {recommendations.length === 0 && (
            <p style={{ color: "#94a3b8", fontSize: "13px" }}>
              No recommendations
            </p>
          )}

          {recommendations.slice(0, 5).map((recommendation) => {
            const colors = RECOMMENDATION_COLORS[recommendation.action];

            return (
              <div
                key={recommendation.id}
                style={{
                  background: colors.background,
                  border: `1px solid ${colors.border}`,
                  color: colors.color,
                  padding: "10px",
                  borderRadius: "8px",
                  marginBottom: "8px",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              >
                <div>{recommendation.action.split("_").join(" ")}</div>
                <div style={{ color: "#94a3b8", marginTop: "4px" }}>
                  {recommendation.reason}
                </div>
                <div style={{ color: "#94a3b8", marginTop: "4px" }}>
                  Drone ID: {recommendation.droneId}
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: "24px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(110, 231, 255, 0.1)",
            borderRadius: "12px",
            padding: "14px",
          }}
        >
          <h3 style={{ marginTop: 0, fontSize: "15px" }}>Event Log</h3>

          {eventLog.length === 0 && (
            <p style={{ color: "#94a3b8", fontSize: "13px" }}>
              No events logged
            </p>
          )}

          {eventLog.map((event) => (
            <div
              key={event.id}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(110, 231, 255, 0.08)",
                borderRadius: "8px",
                padding: "10px",
                marginBottom: "8px",
                fontSize: "12px",
              }}
            >
              <div style={{ color: "#6ee7ff", fontWeight: 700 }}>
                {new Date(event.timestamp).toLocaleTimeString()} ·{" "}
                {event.action.split("_").join(" ")}
              </div>
              <div style={{ color: "white", marginTop: "4px", fontWeight: 700 }}>
                {event.droneName}
              </div>
              <div style={{ color: "#94a3b8", marginTop: "4px" }}>
                {event.reason}
              </div>
            </div>
          ))}
        </div>
      </aside>

      <section style={{ flex: 1, padding: "24px", boxSizing: "border-box" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: "30px" }}>Live Tracking</h2>
            <p style={{ color: "#94a3b8", marginTop: "6px" }}>
              Powered by Vektro Intelligence.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: "10px",
              minWidth: "260px",
              background: "rgba(15, 23, 32, 0.92)",
              border: "1px solid rgba(110, 231, 255, 0.18)",
              borderRadius: "12px",
              padding: "12px",
            }}
          >
            <div
              style={{
                color: "#6ee7ff",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Follow Mode
            </div>

            <div
              style={{
                color: selectedDroneName ? "white" : "#94a3b8",
                fontSize: "12px",
                fontWeight: 700,
                lineHeight: 1.4,
              }}
            >
              {selectedDroneName ?? "Click a drone to follow"}
            </div>

            {followedDroneName && (
              <div
                style={{
                  color: "#6ee7ff",
                  fontSize: "12px",
                  fontWeight: 700,
                  lineHeight: 1.4,
                }}
              >
                Following: {followedDroneName}
              </div>
            )}

            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() => {
                  if (selectedDrone) {
                    flyToDrone(selectedDrone);
                  }
                }}
                disabled={!selectedDrone}
                style={{
                  background: selectedDrone
                    ? "#6ee7ff"
                    : "rgba(255,255,255,0.08)",
                  color: selectedDrone ? "#041016" : "#64748b",
                  border: "1px solid rgba(110, 231, 255, 0.25)",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  fontWeight: 700,
                  cursor: selectedDrone ? "pointer" : "not-allowed",
                }}
              >
                Center Drone
              </button>

              {followDroneId && (
                <button
                  onClick={() => setFollowDroneId(null)}
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    color: "white",
                    border: "1px solid rgba(110, 231, 255, 0.25)",
                    borderRadius: "10px",
                    padding: "10px 14px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Stop Following
                </button>
              )}
            </div>
          </div>
        </div>

        {selectedDrone && (
          <div
            style={{
              background: "rgba(15, 23, 32, 0.95)",
              border: "1px solid rgba(110, 231, 255, 0.12)",
              borderRadius: "14px",
              padding: "16px",
              marginBottom: "16px",
              maxWidth: "440px",
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              {selectedDrone.drone_name ?? "Drone"}
            </h3>

            <p>Status: {selectedDrone.drone_status ?? "unknown"}</p>

            <p
              style={{
                color:
                  (selectedDrone.battery_pct ?? 100) < 30
                    ? "#ff4d4d"
                    : "white",
                fontWeight:
                  (selectedDrone.battery_pct ?? 100) < 30 ? 700 : 400,
              }}
            >
              Battery:{" "}
              {selectedDrone.battery_pct === null ||
              selectedDrone.battery_pct === undefined
                ? "N/A"
                : `${selectedDrone.battery_pct}%`}
            </p>

            {(selectedDrone.battery_pct ?? 100) < 30 && (
              <p style={{ color: "#ff4d4d", fontWeight: 700 }}>
                ⚠️ LOW BATTERY
              </p>
            )}

            <p>Lat: {Number(selectedDrone.latitude).toFixed(4)}</p>
            <p>Lng: {Number(selectedDrone.longitude).toFixed(4)}</p>

            <p>
              Last Ping:{" "}
              {selectedDrone.last_ping
                ? new Date(selectedDrone.last_ping).toLocaleTimeString()
                : "N/A"}
            </p>
          </div>
        )}

        <div
          ref={mapContainerRef}
          style={{
            position: "relative",
            width: "100%",
            height: "680px",
            borderRadius: "18px",
            overflow: "hidden",
            border: "1px solid rgba(110, 231, 255, 0.12)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          }}
        >
          {!MAPBOX_TOKEN && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(15, 23, 32, 0.95)",
                color: "#94a3b8",
                fontSize: "14px",
                fontWeight: 700,
                textAlign: "center",
                padding: "24px",
              }}
            >
              Missing NEXT_PUBLIC_MAPBOX_TOKEN. Add it to .env.local and
              restart the development server.
            </div>
          )}
        </div>
      </section>
      <style jsx global>{`
        .skytrace-marker-responding svg {
          animation: skytrace-marker-responding-pulse 1.35s ease-in-out infinite;
          transform-origin: center bottom;
          will-change: transform, filter;
        }

        .skytrace-marker-return-home svg {
          animation: skytrace-return-home-pulse 1.15s ease-in-out infinite;
          filter: drop-shadow(0 0 8px rgba(255, 77, 77, 0.75));
          transform-origin: center bottom;
          will-change: transform, filter;
        }

        @keyframes skytrace-marker-responding-pulse {
          0%,
          100% {
            transform: scale(1);
            filter: drop-shadow(0 0 5px rgba(110, 231, 255, 0.35));
          }
          50% {
            transform: scale(1.1);
            filter: drop-shadow(0 0 11px rgba(110, 231, 255, 0.6));
          }
        }

        @keyframes skytrace-return-home-pulse {
          0%,
          100% {
            transform: scale(1);
            filter: drop-shadow(0 0 6px rgba(255, 77, 77, 0.55));
          }
          50% {
            transform: scale(1.18);
            filter: drop-shadow(0 0 14px rgba(255, 77, 77, 0.95));
          }
        }
      `}</style>
    </main>
  );
}
