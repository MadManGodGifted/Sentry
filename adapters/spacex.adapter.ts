import dayjs from "dayjs";
import { http } from "@/api/http";
import type { LiveMetric, LiveSatellite, LiveTimelineEvent } from "@/types/live-data";

const SPACEX_BASE = process.env.NEXT_PUBLIC_SPACEX_API_BASE ?? "https://api.spacexdata.com";

type SpaceXLaunch = {
  id: string;
  name: string;
  date_utc?: string;
  upcoming?: boolean;
  success?: boolean;
  details?: string;
};

type SpaceXNamed = { id: string; name?: string; serial?: string };

type Starlink = {
  id: string;
  spaceTrack?: {
    OBJECT_NAME?: string;
    DECAYED?: number;
  };
  latitude?: number;
  longitude?: number;
  height_km?: number;
  velocity_kms?: number;
};

export const spacexAdapter = {
  async getTimeline(): Promise<LiveTimelineEvent[]> {
    const [upcoming, past] = await Promise.all([
      http.get<SpaceXLaunch[]>(`${SPACEX_BASE}/v5/launches/upcoming`),
      http.get<SpaceXLaunch[]>(`${SPACEX_BASE}/v5/launches/past`)
    ]);
    return [
      ...upcoming.data.slice(0, 8).map((launch) => ({
        id: `spacex-upcoming-${launch.id}`,
        source: "SpaceX API",
        kind: "launch" as const,
        title: launch.name,
        detail: "Upcoming launch",
        at: dayjs(launch.date_utc).toISOString()
      })),
      ...past.data.slice(-4).map((launch) => ({
        id: `spacex-past-${launch.id}`,
        source: "SpaceX API",
        kind: "launch" as const,
        title: launch.name,
        detail: launch.success ? "Past launch success" : "Past launch recorded",
        at: dayjs(launch.date_utc).toISOString()
      }))
    ];
  },

  async getTelemetry(): Promise<LiveMetric[]> {
    const [rockets, capsules, ships] = await Promise.all([
      http.get<SpaceXNamed[]>(`${SPACEX_BASE}/v4/rockets`),
      http.get<SpaceXNamed[]>(`${SPACEX_BASE}/v4/capsules`),
      http.get<SpaceXNamed[]>(`${SPACEX_BASE}/v4/ships`)
    ]);
    return [
      { id: "spacex-rockets", label: "SPACEX ROCKETS", value: rockets.data.length, source: "SpaceX API", at: new Date().toISOString() },
      { id: "spacex-capsules", label: "CAPSULES", value: capsules.data.length, source: "SpaceX API", at: new Date().toISOString() },
      { id: "spacex-ships", label: "SHIPS", value: ships.data.length, source: "SpaceX API", at: new Date().toISOString() }
    ];
  },

  async getStarlink(): Promise<LiveSatellite[]> {
    const { data } = await http.get<Starlink[]>(`${SPACEX_BASE}/v4/starlink`);
    return data.slice(0, 18).map((satellite) => ({
      id: `starlink-${satellite.id}`,
      name: satellite.spaceTrack?.OBJECT_NAME ?? `STARLINK ${satellite.id.slice(0, 6)}`,
      provider: "SpaceX API",
      latitude: satellite.latitude,
      longitude: satellite.longitude,
      altitudeKm: satellite.height_km,
      velocityKps: satellite.velocity_kms,
      signal: satellite.spaceTrack?.DECAYED ? 15 : 86,
      status: satellite.spaceTrack?.DECAYED ? "critical" : "nominal"
    }));
  }
};
