import { Link } from "react-router";

export function NotFoundPage() {
  return (
    <section className="page">
      <div className="placeholder-panel">
        <strong>Page not found</strong>
        <span>The requested dashboard page does not exist.</span>

        <Link className="text-link" to="/">
          Return to dashboard
        </Link>
      </div>
    </section>
  );
}