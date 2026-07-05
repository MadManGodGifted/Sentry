import type { GlobePoint } from "@/components/globe/GlobeLayers";

export function hasWebGlSupport() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl") ?? canvas.getContext("experimental-webgl"));
  } catch {
    return false;
  }
}

export function formatPointTooltip(point: GlobePoint) {
  const altitude = point.altitudeKm !== undefined ? `${Math.round(point.altitudeKm)} KM` : "--";
  const velocity = point.velocityKps !== undefined ? `${point.velocityKps.toFixed(2)} KPS` : "--";
  return `
    <div class="globe-tooltip">
      <strong>${point.label}</strong>
      <span>${point.provider}</span>
      <span>ALT ${altitude}</span>
      <span>VEL ${velocity}</span>
      <span>LAT ${point.lat.toFixed(2)} / LON ${point.lng.toFixed(2)}</span>
      <span>STATUS ${point.status.toUpperCase()}</span>
    </div>
  `;
}

export function pointAltitude(point: GlobePoint) {
  if (point.type === "asteroid") {
    return 0.08;
  }

  const altitude = point.altitudeKm ?? 420;
  return Math.min(Math.max(altitude / 42000, 0.015), 0.18);
}
