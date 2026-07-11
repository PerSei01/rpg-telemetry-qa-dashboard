import { Route, Routes } from "react-router";

import { Layout } from "./components/Layout";
import { DashboardPage } from "./pages/DashboardPage";
import { IssuesPage } from "./pages/IssuesPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { SessionDetailsPage } from "./pages/SessionDetailsPage";
import { SessionsPage } from "./pages/SessionsPage";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="sessions" element={<SessionsPage />} />
        <Route
          path="sessions/:sessionId"
          element={<SessionDetailsPage />}
        />
        <Route path="issues" element={<IssuesPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;