"use client";

import type { LiveSatellite, LiveTimelineEvent } from "@/types/live-data";

type OrbitalVisualizationProps = {
  asteroids?: LiveTimelineEvent[];
  onSelectSatellite?: (satelliteId: string) => void;
  selectedSatelliteId?: string | null;
  satellites: LiveSatellite[];
};

function project(latitude?: number, longitude?: number) {
  const x = longitude === undefined ? 50 : ((longitude + 180) / 360) * 100;
  const y = latitude === undefined ? 50 : ((90 - latitude) / 180) * 100;
  return { x: Math.min(Math.max(x, 4), 96), y: Math.min(Math.max(y, 6), 94) };
}

export function OrbitalVisualization({ asteroids = [], onSelectSatellite, satellites, selectedSatelliteId }: OrbitalVisualizationProps) {
  return (
    <button className="orbital-plot live-orbital-plot" onClick={() => onSelectSatellite?.(satellites[0]?.id ?? "")} type="button">
      <svg viewBox="0 0 640 360" role="img" aria-label="Live orbital visualization">
        <defs>
          <filter id="livePhosphorGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle className="live-earth" cx="320" cy="180" r="44" />
        <ellipse className="live-orbit" cx="320" cy="180" rx="214" ry="82" />
        <ellipse className="live-orbit secondary" cx="320" cy="180" rx="148" ry="118" />
        {satellites.slice(0, 24).map((satellite) => {
          const point = project(satellite.latitude, satellite.longitude);
          const selected = satellite.id === selectedSatelliteId;
          return (
            <g className={selected ? "live-contact selected" : "live-contact"} key={satellite.id} onClick={() => onSelectSatellite?.(satellite.id)}>
              <circle cx={(point.x / 100) * 640} cy={(point.y / 100) * 360} r={selected ? 6 : 3.5} />
              <text x={(point.x / 100) * 640 + 8} y={(point.y / 100) * 360 - 5}>
                {satellite.name.slice(0, 14)}
              </text>
            </g>
          );
        })}
        {asteroids.slice(0, 8).map((event, index) => (
          <path className="asteroid-arc" d={`M${32 + index * 64} ${310 - index * 12} C 240 ${80 + index * 8}, 402 ${74 + index * 11}, 610 ${36 + index * 20}`} key={event.id} />
        ))}
      </svg>
      <span className="plot-label label-a">LIVE ORBITAL FRAME / SESSION TRAIL</span>
      <span className="plot-label label-b">SATELLITES {satellites.length}</span>
      <span className="plot-label label-c">EARTH</span>
      <span className="plot-label label-d">ASTEROID TRACKS {asteroids.length}</span>
    </button>
  );
}
