import { Link, useParams } from "react-router";

export function SessionDetailsPage() {
  const { sessionId } = useParams();

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <span className="page-header__eyebrow">Playtest session</span>
          <h1>Session #{sessionId}</h1>
          <p>
            Detailed event timeline and detected issues will be implemented
            next.
          </p>
        </div>

        <Link className="button button--secondary" to="/sessions">
          Back to sessions
        </Link>
      </header>

      <div className="placeholder-panel">
        <strong>Session details route is ready</strong>
        <span>
          The next step will connect this page to{" "}
          <code>GET /sessions/{sessionId}</code>.
        </span>
      </div>
    </section>
  );
}