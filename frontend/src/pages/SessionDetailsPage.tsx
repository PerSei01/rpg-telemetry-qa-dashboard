import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";

import { getBugReportUrl, getSession } from "../api/client";
import { StatCard } from "../components/StatCard";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import type {
  DetectedIssue,
  PlaytestSessionDetail,
  TelemetryEvent,
} from "../types/api";

function formatDate(dateValue: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(dateValue));
}

function formatEventType(eventType: string): string {
  return eventType
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatSeverity(severity: string): string {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}

function getEventCategory(eventType: string): string {
  if (eventType === "player_death") {
    return "danger";
  }

  if (eventType === "fps_drop") {
    return "warning";
  }

  if (
    eventType === "quest_completed" ||
    eventType === "quest_stage_completed" ||
    eventType === "reward_given"
  ) {
    return "success";
  }

  if (
    eventType === "quest_started" ||
    eventType === "entered_area" ||
    eventType === "dialogue_choice_selected"
  ) {
    return "info";
  }

  return "neutral";
}

function getSeverityClass(severity: string): string {
  const normalizedSeverity = severity.toLowerCase();

  if (
    normalizedSeverity === "critical" ||
    normalizedSeverity === "high"
  ) {
    return "issue-card--danger";
  }

  if (normalizedSeverity === "medium") {
    return "issue-card--warning";
  }

  return "issue-card--neutral";
}

function EventTimelineItem({
  event,
  index,
}: {
  event: TelemetryEvent;
  index: number;
}) {
  const category = getEventCategory(event.event_type);
  const payloadEntries = Object.entries(event.payload);

  return (
    <article className="timeline-item">
      <div
        className={`timeline-item__marker timeline-item__marker--${category}`}
        aria-hidden="true"
      >
        {index + 1}
      </div>

      <div className="timeline-item__content">
        <div className="timeline-item__header">
          <div>
            <span
              className={`event-badge event-badge--${category}`}
            >
              {formatEventType(event.event_type)}
            </span>

            <h3>{event.event_type}</h3>
          </div>

          <time dateTime={event.timestamp}>
            {formatDate(event.timestamp)}
          </time>
        </div>

        <div className="metadata-list">
          {event.area && (
            <span>
              Area: <strong>{event.area}</strong>
            </span>
          )}

          {event.quest_id && (
            <span>
              Quest: <strong>{event.quest_id}</strong>
            </span>
          )}

          <span>
            Event ID: <strong>#{event.id}</strong>
          </span>
        </div>

        {payloadEntries.length > 0 && (
          <div className="payload-panel">
            <span className="payload-panel__label">Payload</span>

            <pre>{JSON.stringify(event.payload, null, 2)}</pre>
          </div>
        )}
      </div>
    </article>
  );
}

function IssueCard({ issue }: { issue: DetectedIssue }) {
  return (
    <article
      className={`issue-card ${getSeverityClass(issue.severity)}`}
    >
      <div className="issue-card__header">
        <div>
          <span className="issue-card__severity">
            {formatSeverity(issue.severity)}
          </span>

          <h3>{issue.title}</h3>
        </div>

        <a
          className="button button--secondary"
          href={getBugReportUrl(issue.id)}
          target="_blank"
          rel="noreferrer"
        >
          Open bug report
        </a>
      </div>

      <p>{issue.description}</p>

      <div className="metadata-list">
        <span>
          Issue ID: <strong>#{issue.id}</strong>
        </span>

        {issue.quest_id && (
          <span>
            Quest: <strong>{issue.quest_id}</strong>
          </span>
        )}

        {issue.event_id && (
          <span>
            Related event: <strong>#{issue.event_id}</strong>
          </span>
        )}
      </div>

      {issue.reproduction_steps.length > 0 && (
        <details className="reproduction-details">
          <summary>Steps to reproduce</summary>

          <ol>
            {issue.reproduction_steps.map((step, index) => {
              const stepWithoutNumber = step.replace(
                /^\d+\.\s*/,
                "",
              );

              return (
                <li key={`${issue.id}-${index}`}>
                  {stepWithoutNumber}
                </li>
              );
            })}
          </ol>
        </details>
      )}
    </article>
  );
}

export function SessionDetailsPage() {
  const { sessionId } = useParams();

  const [session, setSession] =
    useState<PlaytestSessionDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useDocumentTitle(
  session
    ? `Session #${session.id}`
    : "Session Details",
);

  const numericSessionId = Number(sessionId);

  useEffect(() => {
    async function loadSession() {
      if (
        !sessionId ||
        !Number.isInteger(numericSessionId) ||
        numericSessionId <= 0
      ) {
        setError("Invalid playtest session ID.");
        setIsLoading(false);
        return;
      }

      try {
        const sessionDetails = await getSession(numericSessionId);
        setSession(sessionDetails);
      } catch (requestError) {
        const message =
          requestError instanceof Error
            ? requestError.message
            : "Unknown session error.";

        setError(message);
      } finally {
        setIsLoading(false);
      }
    }

    void loadSession();
  }, [numericSessionId, sessionId]);

  const sessionStats = useMemo(() => {
    if (!session) {
      return {
        events: 0,
        issues: 0,
        deaths: 0,
        fpsDrops: 0,
      };
    }

    return {
      events: session.events.length,
      issues: session.detected_issues.length,
      deaths: session.events.filter(
        (event) => event.event_type === "player_death",
      ).length,
      fpsDrops: session.events.filter(
        (event) => event.event_type === "fps_drop",
      ).length,
    };
  }, [session]);

  const sortedEvents = useMemo(() => {
    if (!session) {
      return [];
    }

    return [...session.events].sort(
      (first, second) =>
        new Date(first.timestamp).getTime() -
        new Date(second.timestamp).getTime(),
    );
  }, [session]);

  if (isLoading) {
    return (
      <section className="page">
        <div className="status-panel">
          <strong>Loading playtest session...</strong>
          <span>Fetching telemetry events and detected issues.</span>
        </div>
      </section>
    );
  }

  if (error || !session) {
    return (
      <section className="page">
        <div className="status-panel status-panel--error">
          <strong>Could not load session</strong>
          <span>{error ?? "Playtest session was not found."}</span>

          <Link className="text-link" to="/sessions">
            Return to sessions
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <span className="page-header__eyebrow">
            Playtest session #{session.id}
          </span>

          <h1>{session.player_name}</h1>

          <p>
            Build <code>{session.build_version}</code>, started{" "}
            {formatDate(session.started_at)}.
          </p>
        </div>

        <Link className="button button--secondary" to="/sessions">
          Back to sessions
        </Link>
      </header>

      <div className="stat-grid">
        <StatCard
          label="Events"
          value={sessionStats.events}
          description="Recorded telemetry events"
        />

        <StatCard
          label="Detected issues"
          value={sessionStats.issues}
          description="Quest validation findings"
        />

        <StatCard
          label="Player deaths"
          value={sessionStats.deaths}
          description="Death events in this session"
        />

        <StatCard
          label="FPS drops"
          value={sessionStats.fpsDrops}
          description="Performance warning events"
        />
      </div>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <span className="content-panel__eyebrow">
              Validation results
            </span>

            <h2>Detected Issues</h2>
          </div>

          <span className="section-heading__count">
            {session.detected_issues.length}
          </span>
        </div>

        {session.detected_issues.length === 0 ? (
          <div className="status-panel">
            <strong>No issues detected</strong>
            <span>
              This playtest session currently has no validation
              findings.
            </span>
          </div>
        ) : (
          <div className="issue-list">
            {session.detected_issues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        )}
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <span className="content-panel__eyebrow">
              Gameplay telemetry
            </span>

            <h2>Event Timeline</h2>
          </div>

          <span className="section-heading__count">
            {sortedEvents.length}
          </span>
        </div>

        {sortedEvents.length === 0 ? (
          <div className="status-panel">
            <strong>No telemetry events</strong>
            <span>
              This playtest session does not contain any events.
            </span>
          </div>
        ) : (
          <div className="timeline">
            {sortedEvents.map((event, index) => (
              <EventTimelineItem
                key={event.id}
                event={event}
                index={index}
              />
            ))}
          </div>
        )}
      </section>
    </section>
  );
}