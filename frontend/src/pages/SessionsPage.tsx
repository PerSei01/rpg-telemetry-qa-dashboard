import { useEffect, useState } from "react";
import { Link } from "react-router";

import { getSessions } from "../api/client";
import type { PlaytestSessionSummary } from "../types/api";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

function formatDate(dateValue: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateValue));
}

export function SessionsPage() {
  useDocumentTitle("Sessions");
  const [sessions, setSessions] = useState<PlaytestSessionSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSessions() {
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

    void loadSessions();
  }, []);

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <span className="page-header__eyebrow">Playtests</span>
          <h1>Sessions</h1>
          <p>Recorded gameplay sessions received by the telemetry API.</p>
        </div>
      </header>

      {isLoading && (
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

      {!isLoading && !error && sessions.length === 0 && (
        <div className="status-panel">
          <strong>No playtest sessions found</strong>
          <span>
            Run <code>python scripts/generate_sessions.py</code> from the
            backend directory.
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
                <th>Started</th>
                <th aria-label="Actions" />
              </tr>
            </thead>

            <tbody>
              {sessions.map((session) => (
                <tr key={session.id}>
                  <td>#{session.id}</td>
                  <td>{session.player_name}</td>
                  <td>
                    <code>{session.build_version}</code>
                  </td>
                  <td>{formatDate(session.started_at)}</td>
                  <td className="table-actions">
                    <Link
                      className="text-link"
                      to={`/sessions/${session.id}`}
                    >
                      View session
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}