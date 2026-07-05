"use client";

import type { ProviderState } from "@/types/live-data";

type DataStateProps = {
  children: React.ReactNode;
  label: string;
  providers?: ProviderState[];
  count?: number;
};

export function DataState({ children, count, label, providers = [] }: DataStateProps) {
  const blockingProvider = providers.find((provider) => provider.status !== "success" && provider.status !== "empty");
  const hasProviders = providers.length > 0;

  if (!hasProviders) {
    return <StateFrame label={label} status="LOADING" detail="Awaiting provider frame." />;
  }

  if (blockingProvider && !count) {
    return (
      <StateFrame
        label={label}
        status={blockingProvider.status.toUpperCase()}
        detail={blockingProvider.message ?? `${blockingProvider.label} did not return data.`}
      />
    );
  }

  if (!count) {
    return <StateFrame label={label} status="NO DATA" detail="Provider returned an empty frame." />;
  }

  return children;
}

function StateFrame({ detail, label, status }: { detail: string; label: string; status: string }) {
  return (
    <section className="viz-state-frame">
      <span>{label}</span>
      <strong>{status}</strong>
      <p>{detail}</p>
    </section>
  );
}
