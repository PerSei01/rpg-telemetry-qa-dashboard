import {
  useEffect,
  useState,
} from "react";
import { Link } from "react-router";

import { getSessions } from "../api/client";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import type { PlaytestSessionSummary } from "../types/api";

function formatDate(dateValue: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateValue));
}

function formatDuration(
  startedAt: string,
  endedAt: string | null,
): string {
  if (!endedAt) {
    return "In progress";
  }

  const startedTimestamp = new Date(startedAt).getTime();
  const endedTimestamp = new Date(endedAt).getTime();

  if (
    !Number.isFinite(startedTimestamp)
    || !Number.isFinite(endedTimestamp)
  ) {
    return "Unknown";
  }

  const totalSeconds = Math.max(
    0,
    Math.floor(
      (endedTimestamp - startedTimestamp) / 1000,
    ),
  );

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor(
    (totalSeconds % 3600) / 60,
  );
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
}

export function SessionsPage() {
  useDocumentTitle("Sessions");

  const [sessions, setSessions] = useState<
    PlaytestSessionSummary[]
  >([]);
  const [error, setError] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  async function refreshSessions() {
    setIsLoading(true);
    setError(null);

    try {
      const sessionList = await getSessions();
      setSessions(sessionList);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Unknown sessions error.";

      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let ignore = false;

    getSessions()
      .then((sessionList) => {
        if (!ignore) {
          setSessions(sessionList);
        }
      })
      .catch((requestError: unknown) => {
        if (ignore) {
          return;
        }

        const message =
          requestError instanceof Error
            ? requestError.message
            : "Unknown sessions error.";

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
            Playtests
          </span>

          <h1>Sessions</h1>

          <p>
            Recorded gameplay sessions received by the
            telemetry API.
          </p>
        </div>

        <button
          type="button"
          className="button"
          onClick={() => void refreshSessions()}
          disabled={isLoading}
        >
          {isLoading
            ? "Refreshing..."
            : "Refresh sessions"}
        </button>
      </header>

      {isLoading && sessions.length === 0 && (
        <div className="status-panel">
          <strong>Loading sessions...</strong>
        </div>
      )}

      {error && (
        <div className="status-panel status-panel--error">
          <strong>Could not load sessions</strong>
          <span>{error}</span>
        </div>
      )}

      {!isLoading
        && !error
        && sessions.length === 0 && (
          <div className="status-panel">
            <strong>No playtest sessions found</strong>

            <span>
              Run{" "}
              <code>
                python scripts/generate_sessions.py
              </code>{" "}
              from the backend directory.
            </span>
          </div>
        )}

      {sessions.length > 0 && (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Player / scenario</th>
                <th>Build</th>
                <th>Status</th>
                <th>Started</th>
                <th>Duration</th>
                <th aria-label="Actions" />
              </tr>
            </thead>

            <tbody>
              {sessions.map((session) => {
                const isCompleted =
                  session.ended_at !== null;

                return (
                  <tr key={session.id}>
                    <td>#{session.id}</td>

                    <td>{session.player_name}</td>

                    <td>
                      <code>
                        {session.build_version}
                      </code>
                    </td>

                    <td>
                      <span
                        className={
                          isCompleted
                            ? "status-badge status-badge--completed"
                            : "status-badge status-badge--active"
                        }
                      >
                        {isCompleted
                          ? "Completed"
                          : "Active"}
                      </span>
                    </td>

                    <td>
                      {formatDate(session.started_at)}
                    </td>

                    <td>
                      {formatDuration(
                        session.started_at,
                        session.ended_at,
                      )}
                    </td>

                    <td className="table-actions">
                      <Link
                        className="text-link"
                        to={`/sessions/${session.id}`}
                      >
                        View session
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}