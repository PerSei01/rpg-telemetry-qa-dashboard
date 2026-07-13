import { Link } from "react-router";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export function NotFoundPage() {
  useDocumentTitle("Page Not Found");
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