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
        lastUpdate={blockingProvider.updatedAt}
      />
    );
  }

  if (!count) {
    return <StateFrame label={label} status="NO DATA" detail="Provider returned an empty frame." />;
  }

  return children;
}

function StateFrame({ detail, label, lastUpdate, status }: { detail: string; label: string; lastUpdate?: string | null; status: string }) {
  const isLoading = status === "LOADING";

  return (
    <section className="viz-state-frame">
      <header>
        <span>{label}</span>
        <strong>{status}</strong>
      </header>
      {isLoading ? (
        <div className="viz-skeleton-stack" aria-label="Loading provider data">
          <i />
          <i />
          <i />
          <i />
        </div>
      ) : (
        <div className="viz-provider-status-card">
          <dl>
            <div>
              <dt>PROVIDER</dt>
              <dd>{label}</dd>
            </div>
            <div>
              <dt>STATUS</dt>
              <dd>{status}</dd>
            </div>
            <div>
              <dt>LAST UPDATE</dt>
              <dd>{lastUpdate ? new Date(lastUpdate).toLocaleTimeString("en-US", { hour12: false }) : "--:--:--"}</dd>
            </div>
            <div>
              <dt>RETRY</dt>
              <dd>60S</dd>
            </div>
          </dl>
          <p>{detail}</p>
        </div>
      )}
    </section>
  );
}
