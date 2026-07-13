import type {
  AreaRiskLevel,
  DashboardData,
  IssueWithSession,
  PlaytestSessionDetail,
  PlaytestSessionSummary,
} from "../types/api";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

async function apiRequest<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    const responseText = await response.text();

    throw new Error(
      `API request failed: ${response.status} ${response.statusText}. ${responseText}`,
    );
  }

  return response.json() as Promise<T>;
}

export function getSessions(): Promise<PlaytestSessionSummary[]> {
  return apiRequest<PlaytestSessionSummary[]>("/sessions");
}

export function getBugReportUrl(issueId: number): string {
  return `${API_BASE_URL}/issues/${issueId}/bug-report`;
}

export function getSession(
  sessionId: number,
): Promise<PlaytestSessionDetail> {
  return apiRequest<PlaytestSessionDetail>(`/sessions/${sessionId}`);
}

export async function getAllSessionDetails(): Promise<
  PlaytestSessionDetail[]
> {
  const sessions = await getSessions();

  return Promise.all(
    sessions.map((session) => getSession(session.id)),
  );
}

export async function getIssuesOverview(): Promise<
  IssueWithSession[]
> {
  const sessions = await getAllSessionDetails();

  return sessions
    .flatMap((session) =>
      session.detected_issues.map((issue) => ({
        ...issue,
        session_name: session.player_name,
        build_version: session.build_version,
        session_started_at: session.started_at,
      })),
    )
    .sort(
      (first, second) =>
        new Date(second.created_at).getTime() -
        new Date(first.created_at).getTime(),
    );
}

function formatMetricName(value: string): string {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getIssueRiskWeight(severity: string): number {
  switch (severity.toLowerCase()) {
    case "critical":
      return 4;

    case "high":
      return 3;

    case "medium":
      return 2;

    case "low":
      return 1;

    default:
      return 1;
  }
}

function getRiskLevel(riskScore: number): AreaRiskLevel {
  if (riskScore >= 8) {
    return "critical";
  }

  if (riskScore >= 5) {
    return "high";
  }

  if (riskScore >= 2) {
    return "medium";
  }

  return "low";
}

export async function getDashboardData(): Promise<DashboardData> {
  const sessionDetails = await getAllSessionDetails();

  const eventTypeCounts = new Map<string, number>();
  const issueSeverityCounts = new Map<string, number>();

  const areaMetrics = new Map<
    string,
    {
      area: string;
      deaths: number;
      fpsDrops: number;
      issues: number;
      riskScore: number;
    }
  >();

  function getOrCreateAreaMetrics(areaId: string) {
    const existingMetrics = areaMetrics.get(areaId);

    if (existingMetrics) {
      return existingMetrics;
    }

    const newMetrics = {
      area: formatMetricName(areaId),
      deaths: 0,
      fpsDrops: 0,
      issues: 0,
      riskScore: 0,
    };

    areaMetrics.set(areaId, newMetrics);

    return newMetrics;
  }

  for (const session of sessionDetails) {
    for (const event of session.events) {
      const currentEventCount =
        eventTypeCounts.get(event.event_type) ?? 0;

      eventTypeCounts.set(
        event.event_type,
        currentEventCount + 1,
      );

      if (
        event.event_type !== "player_death" &&
        event.event_type !== "fps_drop"
      ) {
        continue;
      }

      const areaId = event.area ?? "unknown";
      const metrics = getOrCreateAreaMetrics(areaId);

      if (event.event_type === "player_death") {
        metrics.deaths += 1;
        metrics.riskScore += 3;
      }

      if (event.event_type === "fps_drop") {
        metrics.fpsDrops += 1;
        metrics.riskScore += 2;
      }
    }

    for (const issue of session.detected_issues) {
      const currentIssueCount =
        issueSeverityCounts.get(issue.severity) ?? 0;

      issueSeverityCounts.set(
        issue.severity,
        currentIssueCount + 1,
      );

      const relatedEvent = issue.event_id
        ? session.events.find(
            (event) => event.id === issue.event_id,
          )
        : undefined;

      const areaId = relatedEvent?.area ?? "unknown";
      const metrics = getOrCreateAreaMetrics(areaId);

      metrics.issues += 1;
      metrics.riskScore += getIssueRiskWeight(
        issue.severity,
      );
    }
  }

  const latestSession = [...sessionDetails].sort(
    (first, second) =>
      new Date(second.started_at).getTime() -
      new Date(first.started_at).getTime(),
  )[0];

  const severityOrder = [
    "critical",
    "high",
    "medium",
    "low",
  ];

  const sortedAreaMetrics = [...areaMetrics.values()].sort(
    (first, second) =>
      second.riskScore - first.riskScore ||
      first.area.localeCompare(second.area),
  );

  return {
    summary: {
      totalSessions: sessionDetails.length,

      totalEvents: sessionDetails.reduce(
        (total, session) => total + session.events.length,
        0,
      ),

      totalIssues: sessionDetails.reduce(
        (total, session) =>
          total + session.detected_issues.length,
        0,
      ),

      latestBuildVersion:
        latestSession?.build_version ?? "N/A",
    },

    eventTypeCounts: [...eventTypeCounts.entries()]
      .map(([eventType, events]) => ({
        name: formatMetricName(eventType),
        events,
      }))
      .sort(
        (first, second) => second.events - first.events,
      ),

    issueSeverityCounts: [
      ...issueSeverityCounts.entries(),
    ]
      .sort(([firstSeverity], [secondSeverity]) => {
        const firstIndex = severityOrder.indexOf(
          firstSeverity,
        );

        const secondIndex = severityOrder.indexOf(
          secondSeverity,
        );

        const normalizedFirstIndex =
          firstIndex === -1
            ? severityOrder.length
            : firstIndex;

        const normalizedSecondIndex =
          secondIndex === -1
            ? severityOrder.length
            : secondIndex;

        return normalizedFirstIndex - normalizedSecondIndex;
      })
      .map(([severity, issues]) => ({
        severity: formatMetricName(severity),
        issues,
      })),

    areaActivity: sortedAreaMetrics
      .filter(
        (metrics) =>
          metrics.deaths > 0 || metrics.fpsDrops > 0,
      )
      .map((metrics) => ({
        area: metrics.area,
        deaths: metrics.deaths,
        fpsDrops: metrics.fpsDrops,
      })),

    areaRisk: sortedAreaMetrics.map((metrics) => ({
      area: metrics.area,
      deaths: metrics.deaths,
      fpsDrops: metrics.fpsDrops,
      issues: metrics.issues,
      riskScore: metrics.riskScore,
      riskLevel: getRiskLevel(metrics.riskScore),
    })),
  };
}