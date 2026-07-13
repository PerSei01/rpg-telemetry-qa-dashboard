import { Suspense } from "react";
import { NavLink, Outlet } from "react-router";

function getNavigationClass({
  isActive,
}: {
  isActive: boolean;
}): string {
  return isActive ? "navigation__link navigation__link--active" : "navigation__link";
}

export function Layout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand__eyebrow">RPG Telemetry</span>
          <strong className="brand__title">QA Dashboard</strong>
        </div>

        <nav className="navigation" aria-label="Main navigation">
          <NavLink to="/" end className={getNavigationClass}>
            Dashboard
          </NavLink>

          <NavLink to="/sessions" className={getNavigationClass}>
            Sessions
          </NavLink>

          <NavLink to="/issues" className={getNavigationClass}>
            Issues
          </NavLink>
        </nav>

        <div className="sidebar__footer">
          <span>Portfolio project</span>
          <span>Backend API v0.1.0</span>
        </div>
      </aside>

      <main className="main-content">
        <Suspense
          fallback={
            <section className="page">
              <div
                className="status-panel"
                role="status"
                aria-live="polite"
              >
                <strong>Loading dashboard page...</strong>
                <span>Downloading the requested application module.</span>
              </div>
            </section>
          }
        >
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}