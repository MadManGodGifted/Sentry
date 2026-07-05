import { http } from "@/api/http";
import type { LiveMetric, LiveSatellite } from "@/types/live-data";

type CelestrakSatellite = {
  OBJECT_NAME?: string;
  NORAD_CAT_ID?: number;
  MEAN_MOTION?: number;
  APOAPSIS?: number;
  PERIAPSIS?: number;
  EPOCH?: string;
};

export const satelliteAdapter = {
  async getCatalog(): Promise<{ satellites: LiveSatellite[]; metrics: LiveMetric[] }> {
    const baseUrl = process.env.NEXT_PUBLIC_CELESTRAK_API_BASE ?? "https://celestrak.org";
    const { data } = await http.get<CelestrakSatellite[]>(`${baseUrl}/NORAD/elements/gp.php`, {
      params: { GROUP: "STATIONS", FORMAT: "JSON" }
    });
    const satellites = data.slice(0, 20).map((satellite) => ({
      id: `cat-${satellite.NORAD_CAT_ID ?? satellite.OBJECT_NAME}`,
      name: satellite.OBJECT_NAME ?? `CAT ${satellite.NORAD_CAT_ID}`,
      provider: "CelesTrak",
      altitudeKm: Math.round(((satellite.APOAPSIS ?? 0) + (satellite.PERIAPSIS ?? 0)) / 2),
      signal: 92,
      status: "tracking" as const
    }));
    return {
      satellites,
      metrics: [
        {
          id: "celestrak-stations",
          label: "STATION OBJECTS",
          value: data.length,
          source: "CelesTrak",
          at: new Date().toISOString()
        }
      ]
    };
  }
};
