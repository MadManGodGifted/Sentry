"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { applyGlobeControls } from "@/components/globe/GlobeControls";
import { buildGlobePoints, type GlobePoint } from "@/components/globe/GlobeLayers";
import { formatPointTooltip, hasWebGlSupport, pointAltitude } from "@/components/globe/GlobeUtils";
import type { LiveSatellite, LiveTimelineEvent } from "@/types/live-data";

type GlobeInstance = {
  backgroundColor: (color: string) => GlobeInstance;
  globeImageUrl: (url: string) => GlobeInstance;
  bumpImageUrl: (url: string) => GlobeInstance;
  atmosphereColor: (color: string) => GlobeInstance;
  atmosphereAltitude: (altitude: number) => GlobeInstance;
  pointsData: (points: GlobePoint[]) => GlobeInstance;
  pointLat: (accessor: (point: GlobePoint) => number) => GlobeInstance;
  pointLng: (accessor: (point: GlobePoint) => number) => GlobeInstance;
  pointAltitude: (accessor: (point: GlobePoint) => number) => GlobeInstance;
  pointRadius: (accessor: (point: GlobePoint) => number) => GlobeInstance;
  pointColor: (accessor: (point: GlobePoint) => string) => GlobeInstance;
  pointLabel: (accessor: (point: GlobePoint) => string) => GlobeInstance;
  onPointClick: (handler: (point: GlobePoint) => void) => GlobeInstance;
  labelsData: (points: GlobePoint[]) => GlobeInstance;
  labelLat: (accessor: (point: GlobePoint) => number) => GlobeInstance;
  labelLng: (accessor: (point: GlobePoint) => number) => GlobeInstance;
  labelAltitude: (accessor: (point: GlobePoint) => number) => GlobeInstance;
  labelText: (accessor: (point: GlobePoint) => string) => GlobeInstance;
  labelSize: (size: number) => GlobeInstance;
  labelColor: (accessor: (point: GlobePoint) => string) => GlobeInstance;
  labelResolution: (resolution: number) => GlobeInstance;
  width: (width: number) => GlobeInstance;
  height: (height: number) => GlobeInstance;
  scene: () => { add: (light: object) => void };
  controls?: () => {
    autoRotate?: boolean;
    autoRotateSpeed?: number;
    enableDamping?: boolean;
    maxDistance?: number;
    minDistance?: number;
  };
  _destructor?: () => void;
};

type GlobeConstructor = new (element: HTMLElement) => GlobeInstance;

type GlobeViewProps = {
  asteroidEvents?: LiveTimelineEvent[];
  fallback: React.ReactNode;
  onSelectSatellite?: (satelliteId: string) => void;
  selectedSatelliteId?: string | null;
  satellites: LiveSatellite[];
};

export function GlobeView({ asteroidEvents = [], fallback, onSelectSatellite, selectedSatelliteId, satellites }: GlobeViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const globeRef = useRef<GlobeInstance | null>(null);
  const [webGlReady, setWebGlReady] = useState(true);
  const points = useMemo(() => buildGlobePoints(satellites), [satellites]);

  useEffect(() => {
    if (!hasWebGlSupport()) {
      setWebGlReady(false);
      return;
    }

    let cancelled = false;

    async function mountGlobe() {
      const element = containerRef.current;
      if (!element) {
        return;
      }

      const [globeModule, threeModule] = await Promise.all([
        import("globe.gl") as Promise<unknown>,
        import("three")
      ]);
      if (cancelled) {
        return;
      }

      const GlobeConstructor = (globeModule as { default: GlobeConstructor }).default;
      const globe = new GlobeConstructor(element)
        .backgroundColor("rgba(0,0,0,0)")
        .globeImageUrl("//unpkg.com/three-globe/example/img/earth-night.jpg")
        .bumpImageUrl("//unpkg.com/three-globe/example/img/earth-topology.png")
        .atmosphereColor("#53D6E8")
        .atmosphereAltitude(0.16)
        .pointLat((point) => point.lat)
        .pointLng((point) => point.lng)
        .pointAltitude(pointAltitude)
        .pointRadius((point) => (point.id === selectedSatelliteId ? 0.42 : point.type === "iss" ? 0.34 : 0.22))
        .pointColor((point) => point.color)
        .pointLabel(formatPointTooltip)
        .onPointClick((point) => {
          onSelectSatellite?.(point.id);
        })
        .labelsData([])
        .labelLat((point) => point.lat)
        .labelLng((point) => point.lng)
        .labelAltitude((point) => pointAltitude(point) + 0.018)
        .labelText((point) => point.label.slice(0, 18))
        .labelSize(0.62)
        .labelColor((point) => point.color)
        .labelResolution(2);

      globe.scene().add(new threeModule.AmbientLight("#E9E4D8", 1.25));
      const directional = new threeModule.DirectionalLight("#C58B29", 0.9);
      directional.position.set(1, 1, 1);
      globe.scene().add(directional);
      applyGlobeControls(globe);
      globeRef.current = globe;
    }

    void mountGlobe();

    return () => {
      cancelled = true;
      globeRef.current?._destructor?.();
      globeRef.current = null;
    };
  }, [onSelectSatellite, selectedSatelliteId]);

  useEffect(() => {
    const element = containerRef.current;
    const globe = globeRef.current;
    if (!element || !globe) {
      return;
    }

    const resize = () => {
      globe.width(element.clientWidth);
      globe.height(element.clientHeight);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => observer.disconnect();
  }, [webGlReady]);

  useEffect(() => {
    globeRef.current?.pointsData(points);
    globeRef.current?.labelsData(points.filter((point) => point.type === "iss" || point.id === selectedSatelliteId).slice(0, 12));
  }, [points, selectedSatelliteId]);

  if (!webGlReady) {
    return fallback;
  }

  return (
    <div className="globe-shell">
      <div className="globe-canvas" ref={containerRef} />
      <div className="globe-readout">
        <span>GLOBE.GL / LIVE ORBITAL FRAME</span>
        <strong>{points.length} OBJ / {asteroidEvents.length} NEO</strong>
      </div>
    </div>
  );
}
