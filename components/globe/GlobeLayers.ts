import type { LiveSatellite } from "@/types/live-data";

export type GlobePoint = {
  altitudeKm?: number;
  color: string;
  id: string;
  label: string;
  lat: number;
  lng: number;
  provider: string;
  status: string;
  type: "iss" | "satellite" | "asteroid";
  velocityKps?: number;
};

function clampCoordinate(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function satelliteToPoint(satellite: LiveSatellite): GlobePoint | null {
  if (satellite.latitude === undefined || satellite.longitude === undefined) {
    return null;
  }

  const isIss = satellite.id.includes("iss") || satellite.name.toLowerCase().includes("iss");
  return {
    altitudeKm: satellite.altitudeKm,
    color: isIss ? "#F06A2A" : satellite.status === "critical" ? "#E5483B" : "#53D6E8",
    id: satellite.id,
    label: satellite.name,
    lat: clampCoordinate(satellite.latitude, -90, 90),
    lng: clampCoordinate(satellite.longitude, -180, 180),
    provider: satellite.provider,
    status: satellite.status,
    type: isIss ? "iss" : "satellite",
    velocityKps: satellite.velocityKps
  };
}

export function buildGlobePoints(satellites: LiveSatellite[]) {
  return satellites.map(satelliteToPoint).filter((point): point is GlobePoint => Boolean(point));
}
