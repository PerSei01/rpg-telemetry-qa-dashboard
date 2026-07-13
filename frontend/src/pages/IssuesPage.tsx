import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link, useSearchParams } from "react-router";

import {
  getBugReportUrl,
  getIssuesOverview,
} from "../api/client";
import { StatCard } from "../components/StatCard";
import type { IssueWithSession } from "../types/api";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

function formatDate(dateValue: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateValue));
}

function formatSeverity(severity: string): string {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
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

export function IssuesPage() {
  useDocumentTitle("Detected Issues");
  const [issues, setIssues] = useState<IssueWithSession[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get("query") ?? "";
  const severityFilter = searchParams.get("severity") ?? "all";
  const buildFilter = searchParams.get("build") ?? "all";
  const questFilter = searchParams.get("quest") ?? "all";

  async function refreshIssues() {
    setIsLoading(true);
    setError(null);

    try {
      const issueList = await getIssuesOverview();
      setIssues(issueList);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Unknown issues error.";

      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let ignore = false;

    getIssuesOverview()
      .then((issueList) => {
        if (!ignore) {
          setIssues(issueList);
        }
      })
      .catch((requestError: unknown) => {
        if (ignore) {
          return;
        }

        const message =
          requestError instanceof Error
            ? requestError.message
            : "Unknown issues error.";

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

  const severityOptions = useMemo(
    () =>
      [...new Set(issues.map((issue) => issue.severity))]
        .sort(),
    [issues],
  );

  const buildOptions = useMemo(
    () =>
      [...new Set(issues.map((issue) => issue.build_version))]
        .sort(),
    [issues],
  );

  const questOptions = useMemo(
    () =>
      [
        ...new Set(
          issues
            .map((issue) => issue.quest_id)
            .filter((questId): questId is string => Boolean(questId)),
        ),
      ].sort(),
    [issues],
  );

  const filteredIssues = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return issues.filter((issue) => {
      const matchesSeverity =
        severityFilter === "all" ||
        issue.severity === severityFilter;

      const matchesBuild =
        buildFilter === "all" ||
        issue.build_version === buildFilter;

      const matchesQuest =
        questFilter === "all" ||
        issue.quest_id === questFilter;

      const searchableText = [
        issue.title,
        issue.description,
        issue.session_name,
        issue.quest_id ?? "",
        issue.build_version,
      ]
        .join(" ")
        .toLowerCase();

      const matchesQuery =
        normalizedQuery.length === 0 ||
        searchableText.includes(normalizedQuery);

      return (
        matchesSeverity &&
        matchesBuild &&
        matchesQuest &&
        matchesQuery
      );
    });
  }, [
    buildFilter,
    issues,
    query,
    questFilter,
    severityFilter,
  ]);

  const issueStats = useMemo(() => {
    const affectedBuilds = new Set(
      issues.map((issue) => issue.build_version),
    );

    return {
      total: issues.length,
      critical: issues.filter(
        (issue) => issue.severity === "critical",
      ).length,
      high: issues.filter(
        (issue) => issue.severity === "high",
      ).length,
      affectedBuilds: affectedBuilds.size,
    };
  }, [issues]);

  function updateFilter(key: string, value: string) {
    const nextParams = new URLSearchParams(searchParams);

    if (
      value.length === 0 ||
      (key !== "query" && value === "all")
    ) {
      nextParams.delete(key);
    } else {
      nextParams.set(key, value);
    }

    setSearchParams(nextParams);
  }

  function clearFilters() {
    setSearchParams({});
  }

  const hasActiveFilters =
    query.length > 0 ||
    severityFilter !== "all" ||
    buildFilter !== "all" ||
    questFilter !== "all";

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <span className="page-header__eyebrow">
            Quest validation
          </span>

          <h1>Detected Issues</h1>

          <p>
            Validation findings collected from all recorded
            playtest sessions.
          </p>
        </div>

        <button
          type="button"
          className="button"
          onClick={() => void refreshIssues()}
          disabled={isLoading}
        >
          {isLoading ? "Refreshing..." : "Refresh issues"}
        </button>
      </header>

      {isLoading && issues.length === 0 && (
        <div className="status-panel">
          <strong>Loading detected issues...</strong>
          <span>
            Fetching playtest sessions and validation findings.
          </span>
        </div>
      )}

      {error && (
        <div className="status-panel status-panel--error">
          <strong>Could not load detected issues</strong>
          <span>{error}</span>
        </div>
      )}

      {!error && (
        <>
          <div className="stat-grid">
            <StatCard
              label="Total issues"
              value={issueStats.total}
              description="All validation findings"
            />

            <StatCard
              label="Critical"
              value={issueStats.critical}
              description="Critical quest logic failures"
            />

            <StatCard
              label="High severity"
              value={issueStats.high}
              description="High-priority validation findings"
            />

            <StatCard
              label="Affected builds"
              value={issueStats.affectedBuilds}
              description="Build versions containing issues"
            />
          </div>

          <section className="filters-panel">
            <div className="filters-panel__header">
              <div>
                <span className="content-panel__eyebrow">
                  Filters
                </span>

                <h2>Find validation issues</h2>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  className="text-button"
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
              )}
            </div>

            <div className="filter-grid">
              <label className="form-field form-field--wide">
                <span>Search</span>

                <input
                  type="search"
                  value={query}
                  placeholder="Search title, description or session..."
                  onChange={(event) =>
                    updateFilter("query", event.target.value)
                  }
                />
              </label>

              <label className="form-field">
                <span>Severity</span>

                <select
                  value={severityFilter}
                  onChange={(event) =>
                    updateFilter(
                      "severity",
                      event.target.value,
                    )
                  }
                >
                  <option value="all">All severities</option>

                  {severityOptions.map((severity) => (
                    <option key={severity} value={severity}>
                      {formatSeverity(severity)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-field">
                <span>Build</span>

                <select
                  value={buildFilter}
                  onChange={(event) =>
                    updateFilter("build", event.target.value)
                  }
                >
                  <option value="all">All builds</option>

                  {buildOptions.map((buildVersion) => (
                    <option
                      key={buildVersion}
                      value={buildVersion}
                    >
                      {buildVersion}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-field">
                <span>Quest</span>

                <select
                  value={questFilter}
                  onChange={(event) =>
                    updateFilter("quest", event.target.value)
                  }
                >
                  <option value="all">All quests</option>

                  {questOptions.map((questId) => (
                    <option key={questId} value={questId}>
                      {questId}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="section-block">
            <div className="section-heading">
              <div>
                <span className="content-panel__eyebrow">
                  Validation results
                </span>

                <h2>Issue List</h2>
              </div>

              <span className="section-heading__count">
                {filteredIssues.length}
              </span>
            </div>

            {!isLoading && issues.length === 0 ? (
              <div className="status-panel">
                <strong>No detected issues</strong>
                <span>
                  Validate broken playtest sessions to generate
                  findings.
                </span>
              </div>
            ) : filteredIssues.length === 0 ? (
              <div className="status-panel">
                <strong>No issues match these filters</strong>
                <span>
                  Change or clear the current filter selection.
                </span>
              </div>
            ) : (
              <div className="issue-list">
                {filteredIssues.map((issue) => (
                  <article
                    key={issue.id}
                    className={`issue-card ${getSeverityClass(
                      issue.severity,
                    )}`}
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

                    <div className="issue-context-grid">
                      <div>
                        <span>Session</span>

                        <Link
                          className="text-link"
                          to={`/sessions/${issue.session_id}`}
                        >
                          #{issue.session_id}{" "}
                          {issue.session_name}
                        </Link>
                      </div>

                      <div>
                        <span>Build</span>
                        <strong>{issue.build_version}</strong>
                      </div>

                      <div>
                        <span>Quest</span>
                        <strong>
                          {issue.quest_id ?? "N/A"}
                        </strong>
                      </div>

                      <div>
                        <span>Detected</span>
                        <strong>
                          {formatDate(issue.created_at)}
                        </strong>
                      </div>
                    </div>

                    {issue.reproduction_steps.length > 0 && (
                      <details className="reproduction-details">
                        <summary>
                          Steps to reproduce (
                          {issue.reproduction_steps.length})
                        </summary>

                        <ol>
                          {issue.reproduction_steps.map(
                            (step, index) => (
                              <li
                                key={`${issue.id}-step-${index}`}
                              >
                                {step.replace(/^\d+\.\s*/, "")}
                              </li>
                            ),
                          )}
                        </ol>
                      </details>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </section>
  );
}