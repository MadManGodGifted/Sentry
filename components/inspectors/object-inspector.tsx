"use client";

import dayjs from "dayjs";
import type { LiveAlert, LiveSatellite, LiveTimelineEvent } from "@/types/live-data";

type ObjectInspectorProps = {
  alerts: LiveAlert[];
  object: LiveSatellite | LiveTimelineEvent | null;
};

export function ObjectInspector({ alerts, object }: ObjectInspectorProps) {
  const rows =
    object && "provider" in object
      ? [
          ["NAME", object.name],
          ["STATUS", object.status.toUpperCase()],
          ["ALTITUDE", object.altitudeKm ? `${Math.round(object.altitudeKm)} KM` : "--"],
          ["VELOCITY", object.velocityKps ? `${object.velocityKps.toFixed(2)} KPS` : "--"],
          ["LAT", object.latitude?.toFixed(3) ?? "--"],
          ["LON", object.longitude?.toFixed(3) ?? "--"],
          ["PROVIDER", object.provider]
        ]
      : object
        ? [
            ["NAME", object.title],
            ["STATUS", object.kind.toUpperCase()],
            ["SOURCE", object.source],
            ["TIMESTAMP", dayjs(object.at).format("YYYY-MM-DD HH:mm")],
            ["DETAIL", object.detail]
          ]
        : [["STATUS", "NO SELECTION"]];

  return (
    <section className="viz-inspector-frame">
      <header>
        <span>OBJECT INSPECTOR</span>
        <strong>{object?.id.slice(0, 12) ?? "NO-ID"}</strong>
      </header>
      <dl>
        {rows.map(([key, value]) => (
          <div key={key}>
            <dt>{key}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <div className="viz-related-alerts">
        <span>RELATED ALERTS</span>
        {alerts.slice(0, 4).map((alert) => (
          <p key={alert.id}>{alert.title}</p>
        ))}
        {!alerts.length ? <p>NO RELATED ALERTS</p> : null}
      </div>
    </section>
  );
}
