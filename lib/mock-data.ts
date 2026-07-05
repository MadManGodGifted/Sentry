import type {
  AppAlert,
  AppWorkspaceId,
  Mission,
  MissionEvent,
  MissionWorkspace,
  MockData,
  MockTelemetry,
  Satellite,
  TelemetryPoint
} from "@/types/app";

const workspaceSeeds: MissionWorkspace[] = [
  { id: "mission-control", section: "Home", name: "Mission Control", code: "MC-01", inspector: "COMMAND LOOP", module: "MODULE" },
  { id: "satellite-tracking", section: "Projects", name: "Satellite Tracking", code: "ST-07", inspector: "ORBITAL TRACK", module: "QUEUE" },
  { id: "earth-observation", section: "Capture", name: "Earth Observation", code: "EO-12", inspector: "SENSOR ARRAY", module: "MEMORY" },
  { id: "launch-monitor", section: "Timeline", name: "Launch Monitor", code: "LM-04", inspector: "COUNTDOWN", module: "CONTEXT" },
  { id: "deep-space", section: "Knowledge", name: "Deep Space", code: "DS-88", inspector: "DEEP FIELD", module: "MODULE" },
  { id: "analytics", section: "Analysis", name: "Analytics", code: "AN-31", inspector: "GRAPH CORE", module: "MEMORY" },
  { id: "intelligence", section: "Research", name: "Intelligence", code: "IN-16", inspector: "RESEARCH CORE", module: "CONTEXT" },
  { id: "settings", section: "Settings", name: "Settings", code: "CFG-00", inspector: "LOCAL CONFIG", module: "MODULE" }
];

const missionNames = ["AURORA VECTOR", "KEPLER NET", "TITAN WATCH", "ORION RELAY", "DAWN SURVEY", "MAGI INDEX"];
const satelliteTypes: Satellite["type"][] = ["relay", "weather", "earth-observation", "deep-space", "navigation"];

function seededValue(seed: number, step: number, min: number, max: number) {
  const wave = Math.sin(seed * 13.37 + step * 0.71) * 0.5 + 0.5;
  return Math.round((min + wave * (max - min)) * 100) / 100;
}

function buildSatellites(missionId: string, seed: number): Satellite[] {
  return Array.from({ length: 7 }, (_, index) => {
    const signal = Math.round(seededValue(seed, index, 52, 99));
    return {
      id: `${missionId}-sat-${index + 1}`,
      missionId,
      name: `${["TDR", "EOS", "NAV", "GEO", "LDR", "DSS", "VIG"][index]}-${Math.round(seededValue(seed, index + 2, 120, 984))}`,
      type: satelliteTypes[(seed + index) % satelliteTypes.length],
      altitudeKm: Math.round(seededValue(seed, index + 3, 420, 35800)),
      velocityKps: seededValue(seed, index + 4, 2.8, 7.9),
      signal,
      status: signal < 61 ? "critical" : signal < 72 ? "warning" : index % 3 === 0 ? "tracking" : "nominal",
      coordinates: `X:${Math.round(seededValue(seed, index + 5, 4, 92))} Y:${Math.round(seededValue(seed, index + 6, 8, 88))}`
    };
  });
}

function buildTelemetry(seed: number): TelemetryPoint[] {
  const specs: Array<[string, string, number, number]> = [
    ["SIGNAL", "%", 54, 99],
    ["THERMAL", "C", -42, 68],
    ["BUS", "V", 22, 31],
    ["DELTA-V", "M/S", 0.01, 3.8],
    ["PACKET", "KB/S", 120, 940],
    ["DRIFT", "DEG", 0.01, 1.44]
  ];

  return specs.map(([label, unit, min, max], index) => ({
    id: `tlm-${label.toLowerCase()}`,
    label,
    value: seededValue(seed, index + Date.now() / 100000, min, max),
    unit,
    trend: seededValue(seed, index + 17, -8, 9)
  }));
}

function buildEvents(missionId: string, seed: number): MissionEvent[] {
  return Array.from({ length: 8 }, (_, index) => ({
    id: `${missionId}-evt-${index}`,
    at: new Date(Date.now() - index * 472000).toISOString(),
    severity: index % 7 === 0 ? "critical" : index % 4 === 0 ? "warning" : index % 3 === 0 ? "mission" : "system",
    message: `${["TELEMETRY SYNC", "ORBIT UPDATE", "SENSOR SWEEP", "FRAME SOLVE", "VECTOR LOCK"][index % 5]} ${Math.round(
      seededValue(seed, index, 10, 98)
    )}`
  }));
}

function buildMissionData(workspaceId: AppWorkspaceId, seed: number): { mission: Mission; telemetry: MockTelemetry } {
  const missionId = `${workspaceId}-mission`;
  const satellites = buildSatellites(missionId, seed);
  const events = buildEvents(missionId, seed);
  const alerts: AppAlert[] = satellites
    .filter((satellite) => satellite.status === "warning" || satellite.status === "critical")
    .slice(0, 3)
    .map((satellite, index) => ({
      id: `${satellite.id}-alert`,
      satelliteId: satellite.id,
      level: satellite.status === "critical" ? "critical" : "warning",
      message: `${satellite.name} SIGNAL ${satellite.signal}%`,
      createdAt: new Date(Date.now() - index * 91300).toISOString()
    }));

  return {
    mission: {
      id: missionId,
      workspaceId,
      name: missionNames[seed % missionNames.length],
      phase: ["TRACK", "SURVEY", "ALIGN", "ANALYZE", "WATCH"][seed % 5],
      orbit: ["LEO", "MEO", "GEO", "L1", "DEEP"][seed % 5],
      startedAt: new Date(Date.now() - seed * 1110000).toISOString()
    },
    telemetry: {
      satellites,
      telemetry: buildTelemetry(seed),
      events,
      alerts
    }
  };
}

export function createMockData(): MockData {
  const missions: Mission[] = [];
  const byMission: MockData["byMission"] = {};

  workspaceSeeds.forEach((workspace, index) => {
    const generated = buildMissionData(workspace.id, index + 3);
    missions.push(generated.mission);
    byMission[generated.mission.id] = generated.telemetry;
  });

  return {
    workspaces: workspaceSeeds,
    missions,
    byMission
  };
}

export function refreshMockTelemetry(current: MockData, missionId: string): MockData {
  const mission = current.missions.find((candidate) => candidate.id === missionId);
  if (!mission) {
    return current;
  }

  const seed = current.workspaces.findIndex((workspace) => workspace.id === mission.workspaceId) + Math.round(Date.now() / 30000);
  return {
    ...current,
    byMission: {
      ...current.byMission,
      [missionId]: {
        ...current.byMission[missionId],
        telemetry: buildTelemetry(seed),
        events: buildEvents(missionId, seed)
      }
    }
  };
}
