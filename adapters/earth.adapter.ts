import dayjs from "dayjs";
import { http } from "@/api/http";
import type { LiveAlert, LiveChartSeries, LiveTimelineEvent } from "@/types/live-data";

type UsgsFeature = {
  id: string;
  properties: {
    mag?: number;
    place?: string;
    time?: number;
    alert?: string;
    type?: string;
  };
};

type UsgsResponse = {
  metadata?: { count?: number; title?: string };
  features?: UsgsFeature[];
};

export const earthAdapter = {
  async getEarthquakes(): Promise<{ alerts: LiveAlert[]; timeline: LiveTimelineEvent[]; charts: LiveChartSeries[] }> {
    const { data } = await http.get<UsgsResponse>("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson");
    const features = data.features ?? [];
    return {
      alerts: features.slice(0, 8).map((feature) => ({
        id: `usgs-${feature.id}`,
        source: "USGS Earthquakes",
        severity: (feature.properties.mag ?? 0) >= 6 ? "critical" : "warning",
        title: `M${feature.properties.mag ?? "--"} EARTHQUAKE`,
        detail: feature.properties.place ?? "USGS event",
        at: dayjs(feature.properties.time).toISOString()
      })),
      timeline: features.map((feature) => ({
        id: `usgs-event-${feature.id}`,
        source: "USGS Earthquakes",
        kind: "natural-event",
        title: `M${feature.properties.mag ?? "--"} ${feature.properties.place ?? "Earthquake"}`,
        detail: feature.properties.type ?? "earthquake",
        at: dayjs(feature.properties.time).toISOString()
      })),
      charts: [
        {
          id: "earthquake-magnitude",
          label: "USGS M4.5+ MAGNITUDE",
          points: features.slice(0, 12).map((feature) => ({
            x: dayjs(feature.properties.time).format("HH:mm"),
            y: feature.properties.mag ?? 0
          }))
        }
      ]
    };
  }
};
