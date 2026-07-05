import dayjs from "dayjs";
import { http } from "@/api/http";
import type { LiveMetric, LiveSatellite, LiveTimelineEvent } from "@/types/live-data";

type IssPosition = {
  name?: string;
  id?: number;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  velocity?: number;
  timestamp?: number;
};

type CrewResponse = {
  people?: Array<{ name: string; craft: string }>;
  number?: number;
};

export const issAdapter = {
  async getPosition(): Promise<{ satellites: LiveSatellite[]; metrics: LiveMetric[]; timeline: LiveTimelineEvent[] }> {
    const { data } = await http.get<IssPosition>("https://api.wheretheiss.at/v1/satellites/25544");
    const at = data.timestamp ? dayjs.unix(data.timestamp).toISOString() : new Date().toISOString();
    return {
      satellites: [
        {
          id: "iss-25544",
          name: data.name ?? "ISS",
          provider: "Where the ISS at",
          latitude: data.latitude,
          longitude: data.longitude,
          altitudeKm: data.altitude,
          velocityKps: data.velocity ? data.velocity / 3600 : undefined,
          signal: 100,
          status: "tracking"
        }
      ],
      metrics: [
        { id: "iss-altitude", label: "ISS ALTITUDE", value: Math.round(data.altitude ?? 0), unit: "KM", source: "Where the ISS at", at },
        { id: "iss-velocity", label: "ISS SPEED", value: Math.round(data.velocity ?? 0), unit: "KM/H", source: "Where the ISS at", at }
      ],
      timeline: [
        {
          id: `iss-pos-${data.timestamp ?? Date.now()}`,
          source: "Where the ISS at",
          kind: "iss",
          title: "ISS POSITION UPDATE",
          detail: `LAT ${data.latitude?.toFixed(2) ?? "--"} / LON ${data.longitude?.toFixed(2) ?? "--"}`,
          at
        }
      ]
    };
  },

  async getCrew(): Promise<LiveMetric[]> {
    const { data } = await http.get<CrewResponse>("http://api.open-notify.org/astros.json");
    return [
      {
        id: "iss-crew",
        label: "PEOPLE IN SPACE",
        value: data.number ?? data.people?.length ?? 0,
        source: "Open Notify",
        at: new Date().toISOString()
      }
    ];
  }
};
