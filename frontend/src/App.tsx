import { lazy } from "react";
import { Route, Routes } from "react-router";

import { Layout } from "./components/Layout";

const DashboardPage = lazy(async () => {
  const module = await import("./pages/DashboardPage");

  return {
    default: module.DashboardPage,
  };
});

const SessionsPage = lazy(async () => {
  const module = await import("./pages/SessionsPage");

  return {
    default: module.SessionsPage,
  };
});

const SessionDetailsPage = lazy(async () => {
  const module = await import("./pages/SessionDetailsPage");

  return {
    default: module.SessionDetailsPage,
  };
});

const IssuesPage = lazy(async () => {
  const module = await import("./pages/IssuesPage");

  return {
    default: module.IssuesPage,
  };
});

const NotFoundPage = lazy(async () => {
  const module = await import("./pages/NotFoundPage");

  return {
    default: module.NotFoundPage,
  };
});

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />

        <Route
          path="sessions"
          element={<SessionsPage />}
        />

        <Route
          path="sessions/:sessionId"
          element={<SessionDetailsPage />}
        />

        <Route
          path="issues"
          element={<IssuesPage />}
        />

        <Route
          path="*"
          element={<NotFoundPage />}
        />
      </Route>
    </Routes>
  );
}

export default App;