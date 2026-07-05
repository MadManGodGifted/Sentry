"use client";

import dayjs from "dayjs";
import type { LiveTimelineEvent } from "@/types/live-data";

type EventTimelineProps = {
  events: LiveTimelineEvent[];
  title: string;
};

export function EventTimeline({ events, title }: EventTimelineProps) {
  return (
    <section className="viz-timeline-frame">
      <header>
        <span>{title}</span>
        <strong>{events.length} EVT</strong>
      </header>
      <div className="viz-timeline-list">
        {events.slice(0, 12).map((event) => (
          <button key={event.id} type="button">
            <time>{dayjs(event.at).format("MMM DD HH:mm")}</time>
            <span>{event.title}</span>
            <strong>{event.source}</strong>
          </button>
        ))}
      </div>
    </section>
  );
}
