export interface PlaytestSessionSummary {
  id: number;
  player_name: string;
  build_version: string;
  started_at: string;
  ended_at: string | null;
}

export interface TelemetryEvent {
  id: number;
  session_id: number;
  event_type: string;
  timestamp: string;
  area: string | null;
  quest_id: string | null;
  payload: Record<string, unknown>;
}

export interface DetectedIssue {
  id: number;
  session_id: number;
  severity: string;
  title: string;
  description: string;
  quest_id: string | null;
  event_id: number | null;
  reproduction_steps: string[];
  created_at: string;
}

export interface PlaytestSessionDetail extends PlaytestSessionSummary {
  events: TelemetryEvent[];
  detected_issues: DetectedIssue[];
}

export interface DashboardSummary {
  totalSessions: number;
  totalEvents: number;
  totalIssues: number;
  latestBuildVersion: string;
}