import type {
  DashboardSummary,
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

export function getSession(
  sessionId: number,
): Promise<PlaytestSessionDetail> {
  return apiRequest<PlaytestSessionDetail>(`/sessions/${sessionId}`);
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const sessions = await getSessions();

  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      totalEvents: 0,
      totalIssues: 0,
      latestBuildVersion: "N/A",
    };
  }

  const sessionDetails = await Promise.all(
    sessions.map((session) => getSession(session.id)),
  );

  const latestSession = [...sessions].sort(
    (first, second) =>
      new Date(second.started_at).getTime() -
      new Date(first.started_at).getTime(),
  )[0];

  return {
    totalSessions: sessions.length,
    totalEvents: sessionDetails.reduce(
      (total, session) => total + session.events.length,
      0,
    ),
    totalIssues: sessionDetails.reduce(
      (total, session) => total + session.detected_issues.length,
      0,
    ),
    latestBuildVersion: latestSession.build_version,
  };
}