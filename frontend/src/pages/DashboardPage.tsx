import { useCallback, useEffect, useState } from "react";

import { getDashboardSummary } from "../api/client";
import { StatCard } from "../components/StatCard";
import type { DashboardSummary } from "../types/api";

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const dashboardSummary = await getDashboardSummary();
      setSummary(dashboardSummary);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Unknown dashboard error.";

      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <span className="page-header__eyebrow">Overview</span>
          <h1>Playtest Dashboard</h1>
          <p>
            Current gameplay telemetry, detected quest issues, and test build
            information.
          </p>
        </div>

        <button
          type="button"
          className="button"
          onClick={() => void loadSummary()}
          disabled={isLoading}
        >
          {isLoading ? "Refreshing..." : "Refresh data"}
        </button>
      </header>

      {isLoading && !summary && (
        <div className="status-panel">
          <strong>Loading dashboard data...</strong>
          <span>Fetching playtest sessions from the backend.</span>
        </div>
      )}

      {error && (
        <div className="status-panel status-panel--error">
          <strong>Could not load dashboard</strong>
          <span>{error}</span>
          <span>
            Make sure FastAPI is running at{" "}
            <code>http://127.0.0.1:8000</code>.
          </span>
        </div>
      )}

      {summary && (
        <>
          <div className="stat-grid">
            <StatCard
              label="Total sessions"
              value={summary.totalSessions}
              description="Recorded playtest sessions"
            />

            <StatCard
              label="Total events"
              value={summary.totalEvents}
              description="Collected telemetry events"
            />

            <StatCard
              label="Detected issues"
              value={summary.totalIssues}
              description="Quest validation findings"
            />

            <StatCard
              label="Latest build"
              value={summary.latestBuildVersion}
              description="Most recent tested build"
            />
          </div>

          <section className="content-panel">
            <div className="content-panel__header">
              <div>
                <span className="content-panel__eyebrow">System status</span>
                <h2>Telemetry pipeline connected</h2>
              </div>

              <span className="status-badge status-badge--success">
                Operational
              </span>
            </div>

            <p>
              The frontend can retrieve playtest sessions, telemetry events,
              detected issues, and build information from the FastAPI backend.
            </p>
          </section>
        </>
      )}
    </section>
  );
}