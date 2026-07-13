import {
  useEffect,
  useState,
} from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getDashboardData } from "../api/client";
import { StatCard } from "../components/StatCard";
import type { DashboardData } from "../types/api";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

const tooltipContentStyle = {
  border: "1px solid #343c4d",
  borderRadius: "0.55rem",
  background: "#151a23",
  color: "#e7eaf0",
};

const tooltipLabelStyle = {
  color: "#ffffff",
  fontWeight: 700,
};

const tooltipItemStyle = {
  color: "#cbd2df",
};

const axisTickStyle = {
  fill: "#8f99ab",
  fontSize: 12,
};

function formatRiskLevel(riskLevel: string): string {
  return (
    riskLevel.charAt(0).toUpperCase() +
    riskLevel.slice(1)
  );
}

function getRiskBadgeClass(riskLevel: string): string {
  return `risk-badge risk-badge--${riskLevel}`;
}

function ChartEmptyState({
  message,
}: {
  message: string;
}) {
  return (
    <div className="chart-empty-state">
      <strong>No chart data</strong>
      <span>{message}</span>
    </div>
  );
}

export function DashboardPage() {
  useDocumentTitle("Dashboard");
  const [dashboardData, setDashboardData] =
    useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function refreshDashboard() {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getDashboardData();
      setDashboardData(data);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Unknown dashboard error.";

      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let ignore = false;

    getDashboardData()
      .then((data) => {
        if (!ignore) {
          setDashboardData(data);
        }
      })
      .catch((requestError: unknown) => {
        if (ignore) {
          return;
        }

        const message =
          requestError instanceof Error
            ? requestError.message
            : "Unknown dashboard error.";

        setError(message);
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <span className="page-header__eyebrow">
            Overview
          </span>

          <h1>Playtest Dashboard</h1>

          <p>
            Current gameplay telemetry, detected quest issues,
            and test build information.
          </p>
        </div>

        <button
          type="button"
          className="button"
          onClick={() => void refreshDashboard()}
          disabled={isLoading}
        >
          {isLoading ? "Refreshing..." : "Refresh data"}
        </button>
      </header>

      {isLoading && !dashboardData && (
        <div className="status-panel">
          <strong>Loading dashboard data...</strong>

          <span>
            Fetching playtest sessions from the backend.
          </span>
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

      {dashboardData && (
        <>
          <div className="stat-grid">
            <StatCard
              label="Total sessions"
              value={dashboardData.summary.totalSessions}
              description="Recorded playtest sessions"
            />

            <StatCard
              label="Total events"
              value={dashboardData.summary.totalEvents}
              description="Collected telemetry events"
            />

            <StatCard
              label="Detected issues"
              value={dashboardData.summary.totalIssues}
              description="Quest validation findings"
            />

            <StatCard
              label="Latest build"
              value={
                dashboardData.summary.latestBuildVersion
              }
              description="Most recent tested build"
            />
          </div>

          <section className="section-block">
            <div className="section-heading">
              <div>
                <span className="content-panel__eyebrow">
                  Telemetry analytics
                </span>

                <h2>Gameplay Overview</h2>
              </div>
            </div>

            <div className="analytics-grid">
              <article className="chart-card chart-card--wide">
                <div className="chart-card__header">
                  <div>
                    <h3>Telemetry Events by Type</h3>

                    <p>
                      Distribution of recorded gameplay events
                      across all playtest sessions.
                    </p>
                  </div>

                  <span className="chart-card__metric">
                    {
                      dashboardData.eventTypeCounts
                        .length
                    }{" "}
                    types
                  </span>
                </div>

                <section className="section-block">
  <div className="section-heading">
    <div>
      <span className="content-panel__eyebrow">
        QA risk analysis
      </span>

      <h2>Area Risk Overview</h2>
    </div>

    <span className="section-heading__count">
      {dashboardData.areaRisk.length}
    </span>
  </div>

  <div className="risk-methodology">
    <strong>Risk score methodology</strong>

    <span>
      Death +3, FPS drop +2, critical issue +4,
      high +3, medium +2, low +1.
    </span>
  </div>

  {dashboardData.areaRisk.length === 0 ? (
    <div className="status-panel">
      <strong>No area risk data</strong>

      <span>
        Generate playtest sessions containing deaths,
        performance drops, or detected issues.
      </span>
    </div>
  ) : (
    <div className="table-wrapper">
      <table className="risk-table">
        <thead>
          <tr>
            <th>Area</th>
            <th>Deaths</th>
            <th>FPS drops</th>
            <th>Issues</th>
            <th>Risk score</th>
            <th>Risk level</th>
          </tr>
        </thead>

        <tbody>
          {dashboardData.areaRisk.map((area) => (
            <tr key={area.area}>
              <td>
                <strong>{area.area}</strong>
              </td>

              <td>{area.deaths}</td>

              <td>{area.fpsDrops}</td>

              <td>{area.issues}</td>

              <td>
                <span className="risk-score">
                  {area.riskScore}
                </span>
              </td>

              <td>
                <span
                  className={getRiskBadgeClass(
                    area.riskLevel,
                  )}
                >
                  {formatRiskLevel(area.riskLevel)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</section>

                {dashboardData.eventTypeCounts.length === 0 ? (
                  <ChartEmptyState message="Generate playtest sessions to populate telemetry events." />
                ) : (
                  <div
                    className="chart-frame"
                    style={{
                      height: Math.min(
                        560,
                        Math.max(
                          320,
                          dashboardData.eventTypeCounts
                            .length * 38,
                        ),
                      ),
                    }}
                  >
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <BarChart
                        data={
                          dashboardData.eventTypeCounts
                        }
                        layout="vertical"
                        margin={{
                          top: 10,
                          right: 25,
                          bottom: 10,
                          left: 10,
                        }}
                      >
                        <CartesianGrid
                          stroke="#2d3441"
                          strokeDasharray="4 4"
                          horizontal={false}
                        />

                        <XAxis
                          type="number"
                          allowDecimals={false}
                          tick={axisTickStyle}
                          axisLine={{
                            stroke: "#3a4251",
                          }}
                          tickLine={false}
                        />

                        <YAxis
                          type="category"
                          dataKey="name"
                          width={155}
                          tick={axisTickStyle}
                          axisLine={false}
                          tickLine={false}
                        />

                        <Tooltip
                          contentStyle={
                            tooltipContentStyle
                          }
                          labelStyle={
                            tooltipLabelStyle
                          }
                          itemStyle={tooltipItemStyle}
                          cursor={{
                            fill: "rgba(255, 255, 255, 0.035)",
                          }}
                        />

                        <Bar
                          dataKey="events"
                          name="Events"
                          fill="#6877df"
                          radius={[0, 5, 5, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </article>

              <article className="chart-card">
                <div className="chart-card__header">
                  <div>
                    <h3>Issues by Severity</h3>

                    <p>
                      Validation findings grouped by their
                      assigned severity.
                    </p>
                  </div>
                </div>

                {dashboardData.issueSeverityCounts
                  .length === 0 ? (
                  <ChartEmptyState message="Validate broken sessions to generate detected issues." />
                ) : (
                  <div className="chart-frame">
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <BarChart
                        data={
                          dashboardData.issueSeverityCounts
                        }
                        margin={{
                          top: 15,
                          right: 15,
                          bottom: 5,
                          left: 0,
                        }}
                      >
                        <CartesianGrid
                          stroke="#2d3441"
                          strokeDasharray="4 4"
                          vertical={false}
                        />

                        <XAxis
                          dataKey="severity"
                          tick={axisTickStyle}
                          axisLine={{
                            stroke: "#3a4251",
                          }}
                          tickLine={false}
                        />

                        <YAxis
                          allowDecimals={false}
                          tick={axisTickStyle}
                          axisLine={false}
                          tickLine={false}
                        />

                        <Tooltip
                          contentStyle={
                            tooltipContentStyle
                          }
                          labelStyle={
                            tooltipLabelStyle
                          }
                          itemStyle={tooltipItemStyle}
                          cursor={{
                            fill: "rgba(255, 255, 255, 0.035)",
                          }}
                        />

                        <Bar
                          dataKey="issues"
                          name="Issues"
                          fill="#c65f68"
                          radius={[5, 5, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </article>

              <article className="chart-card">
                <div className="chart-card__header">
                  <div>
                    <h3>Deaths and FPS Drops by Area</h3>

                    <p>
                      Potentially problematic game areas based
                      on death and performance events.
                    </p>
                  </div>
                </div>

                {dashboardData.areaActivity.length === 0 ? (
                  <ChartEmptyState message="No player death or FPS drop events were recorded." />
                ) : (
                  <div className="chart-frame">
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <BarChart
                        data={dashboardData.areaActivity}
                        margin={{
                          top: 15,
                          right: 15,
                          bottom: 5,
                          left: 0,
                        }}
                      >
                        <CartesianGrid
                          stroke="#2d3441"
                          strokeDasharray="4 4"
                          vertical={false}
                        />

                        <XAxis
                          dataKey="area"
                          tick={axisTickStyle}
                          axisLine={{
                            stroke: "#3a4251",
                          }}
                          tickLine={false}
                        />

                        <YAxis
                          allowDecimals={false}
                          tick={axisTickStyle}
                          axisLine={false}
                          tickLine={false}
                        />

                        <Tooltip
                          contentStyle={
                            tooltipContentStyle
                          }
                          labelStyle={
                            tooltipLabelStyle
                          }
                          itemStyle={tooltipItemStyle}
                          cursor={{
                            fill: "rgba(255, 255, 255, 0.035)",
                          }}
                        />

                        <Legend
                          wrapperStyle={{
                            color: "#aab2c2",
                            fontSize: "0.8rem",
                          }}
                        />

                        <Bar
                          dataKey="deaths"
                          name="Player deaths"
                          fill="#c65f68"
                          radius={[5, 5, 0, 0]}
                        />

                        <Bar
                          dataKey="fpsDrops"
                          name="FPS drops"
                          fill="#bd8f43"
                          radius={[5, 5, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </article>
            </div>
          </section>

          <section className="content-panel">
            <div className="content-panel__header">
              <div>
                <span className="content-panel__eyebrow">
                  System status
                </span>

                <h2>Telemetry pipeline connected</h2>
              </div>

              <span className="status-badge status-badge--success">
                Operational
              </span>
            </div>

            <p>
              The frontend can retrieve playtest sessions,
              telemetry events, detected issues, and build
              information from the FastAPI backend.
            </p>
          </section>
        </>
      )}
    </section>
  );
}