"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getLiveDataSnapshot } from "@/providers/live-data.provider";
import { useAppStore } from "@/store/app.store";

export function useLiveDataEngine() {
  const setLiveData = useAppStore((state) => state.setLiveData);
  const addLog = useAppStore((state) => state.addLog);
  const pushNotification = useAppStore((state) => state.pushNotification);

  const query = useQuery({
    queryKey: ["sentry", "live-data"],
    queryFn: getLiveDataSnapshot,
    refetchInterval: 60000,
    retry: 2
  });

  useEffect(() => {
    if (!query.data) {
      return;
    }

    setLiveData(query.data);
    const topAlert = query.data.alerts.find((alert) => alert.severity === "critical" || alert.severity === "warning");
    const topEvent = query.data.timeline[0];
    if (topAlert) {
      addLog(`[ALERT] ${topAlert.title} ${topAlert.detail}`);
      pushNotification(topAlert.severity === "critical" ? "critical" : "warning", topAlert.title, topAlert.detail);
    } else if (topEvent) {
      addLog(`[MISSION] ${topEvent.title}`);
    }
  }, [addLog, pushNotification, query.data, setLiveData]);

  useEffect(() => {
    if (query.isError) {
      addLog("[WARN] Live data engine entered offline/error mode.");
    }
  }, [addLog, query.isError]);

  return query;
}
