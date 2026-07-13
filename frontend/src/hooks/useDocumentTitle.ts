import { useEffect } from "react";

const APPLICATION_NAME = "RPG Telemetry QA Dashboard";

export function useDocumentTitle(pageTitle: string): void {
  useEffect(() => {
    document.title = `${pageTitle} | ${APPLICATION_NAME}`;
  }, [pageTitle]);
}