import dayjs from "dayjs";
import { http } from "@/api/http";
import type { LiveAlert, LiveChartSeries, LiveMetric } from "@/types/live-data";

type KpRow = [string, string, string, string];
type SolarWindRow = [string, string, string, string, string, string, string];

export const solarWeatherAdapter = {
  async getSolarWeather(): Promise<{ metrics: LiveMetric[]; alerts: LiveAlert[]; charts: LiveChartSeries[] }> {
    const baseUrl = process.env.NEXT_PUBLIC_NOAA_SWPC_API_BASE ?? "https://services.swpc.noaa.gov";
    const [kp, solarWind] = await Promise.all([
      http.get<KpRow[]>(`${baseUrl}/products/noaa-planetary-k-index.json`),
      http.get<SolarWindRow[]>(`${baseUrl}/products/solar-wind/plasma-1-day.json`)
    ]);
    const kpRows = kp.data.slice(1);
    const latestKp = kpRows[kpRows.length - 1];
    const windRows = solarWind.data.slice(1);
    const latestWind = windRows[windRows.length - 1];
    const kpValue = Number(latestKp?.[1] ?? 0);

    return {
      metrics: [
        { id: "noaa-kp", label: "KP INDEX", value: kpValue, source: "NOAA SWPC", at: dayjs(latestKp?.[0]).toISOString() },
        { id: "noaa-solar-wind", label: "SOLAR WIND", value: Number(latestWind?.[2] ?? 0), unit: "KM/S", source: "NOAA SWPC", at: dayjs(latestWind?.[0]).toISOString() }
      ],
      alerts:
        kpValue >= 5
          ? [
              {
                id: `noaa-kp-${latestKp?.[0]}`,
                source: "NOAA SWPC",
                severity: kpValue >= 7 ? "critical" : "warning",
                title: `GEOMAGNETIC STORM KP ${kpValue}`,
                detail: "Planetary K-index elevated",
                at: dayjs(latestKp?.[0]).toISOString()
              }
            ]
          : [],
      charts: [
        {
          id: "kp-index",
          label: "NOAA KP INDEX",
          points: kpRows.slice(-12).map((row) => ({ x: dayjs(row[0]).format("HH:mm"), y: Number(row[1] ?? 0) }))
        },
        {
          id: "solar-wind",
          label: "NOAA SOLAR WIND",
          points: windRows.slice(-12).map((row) => ({ x: dayjs(row[0]).format("HH:mm"), y: Number(row[2] ?? 0) }))
        }
      ]
    };
  }
};
