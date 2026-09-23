"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { ActionButton } from "@/components/ui/ActionButton";
import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  integrationErrorSources,
  integrationErrors,
  type IntegrationError,
  type IntegrationErrorSeverity,
  type IntegrationErrorStatus,
} from "@/data/integration-errors";

type DisplayStatus = IntegrationErrorStatus | "Retry Queued";

const allFilterValue = "All";

const severityTones: Record<IntegrationErrorSeverity, "danger" | "warning" | "info" | "muted"> = {
  Critical: "danger",
  High: "danger",
  Medium: "warning",
  Low: "info",
};

function statusTone(status: DisplayStatus) {
  if (status === "Resolved") return "success" as const;
  if (status === "Retry Pending" || status === "Retry Queued") return "warning" as const;
  if (status === "Open") return "danger" as const;
  return "info" as const;
}

function sourceHref(source: IntegrationError["source"]) {
  return integrationErrorSources.find((item) => item.source === source)?.href ?? "/admin/integration-monitoring";
}

function matchesQuery(error: IntegrationError, query: string) {
  if (!query) return true;

  return [
    error.id,
    error.source,
    error.category,
    error.severity,
    error.status,
    error.summary,
    error.affectedReference,
    error.relatedBatch,
    error.relatedEmployeeId,
    error.relatedRecordId,
  ].some((value) => value?.toLowerCase().includes(query));
}

export function IntegrationErrorsExplorer() {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState(allFilterValue);
  const [severity, setSeverity] = useState(allFilterValue);
  const [category, setCategory] = useState(allFilterValue);
  const [status, setStatus] = useState(allFilterValue);
  const [selectedId, setSelectedId] = useState(integrationErrors[0]?.id ?? "");
  const [retryStates, setRetryStates] = useState<Record<string, "Retry Queued">>({});
  const [acknowledgedIds, setAcknowledgedIds] = useState<string[]>([]);

  const categories = useMemo(
    () => Array.from(new Set(integrationErrors.map((error) => error.category))).sort(),
    [],
  );

  const filteredErrors = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return integrationErrors.filter((error) => (
      matchesQuery(error, normalizedQuery)
      && (source === allFilterValue || error.source === source)
      && (severity === allFilterValue || error.severity === severity)
      && (category === allFilterValue || error.category === category)
      && (status === allFilterValue || error.status === status)
    ));
  }, [category, query, severity, source, status]);

  const selectedError = filteredErrors.find((error) => error.id === selectedId) ?? filteredErrors[0] ?? null;

  function displayStatus(error: IntegrationError): DisplayStatus {
    return retryStates[error.id] ?? error.status;
  }

  function clearFilters() {
    setQuery("");
    setSource(allFilterValue);
    setSeverity(allFilterValue);
    setCategory(allFilterValue);
    setStatus(allFilterValue);
    setSelectedId(integrationErrors[0]?.id ?? "");
  }

  function queueRetry(error: IntegrationError) {
    if (!error.retryable) return;

    setRetryStates((current) => ({ ...current, [error.id]: "Retry Queued" }));
    setSelectedId(error.id);
  }

  function acknowledge(error: IntegrationError) {
    setAcknowledgedIds((current) => current.includes(error.id) ? current : [...current, error.id]);
  }

  return (
    <div className="integration-errors-explorer">
      <div className="integration-errors-toolbar" role="search" aria-label="Filter integration errors">
        <label className="field field-search" htmlFor="integration-error-search">
          <span>Search errors</span>
          <input
            id="integration-error-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search ID, source, record, or message"
          />
        </label>
        <label className="field" htmlFor="integration-error-source">
          <span>Source</span>
          <select id="integration-error-source" value={source} onChange={(event) => setSource(event.target.value)}>
            <option value={allFilterValue}>All sources</option>
            {integrationErrorSources.map((item) => <option key={item.source} value={item.source}>{item.source}</option>)}
          </select>
        </label>
        <label className="field" htmlFor="integration-error-severity">
          <span>Severity</span>
          <select id="integration-error-severity" value={severity} onChange={(event) => setSeverity(event.target.value)}>
            <option value={allFilterValue}>All severities</option>
            <option>Critical</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </label>
        <label className="field" htmlFor="integration-error-category">
          <span>Category</span>
          <select id="integration-error-category" value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value={allFilterValue}>All categories</option>
            {categories.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="field" htmlFor="integration-error-status">
          <span>Status</span>
          <select id="integration-error-status" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value={allFilterValue}>All statuses</option>
            <option>Open</option>
            <option>Under Review</option>
            <option>Retry Pending</option>
            <option>Resolved</option>
          </select>
        </label>
        <button type="button" className="button-secondary integration-errors-clear" onClick={clearFilters}>
          <Icon name="filter" />
          Clear filters
        </button>
      </div>

      <div className="table-meta">
        <span>Showing {filteredErrors.length} of {integrationErrors.length} errors</span>
        <span>Mock data · no live error feed</span>
      </div>

      <div className="integration-errors-table-scroll">
        <table className="data-table integration-errors-table">
          <caption className="sr-only">Integration errors requiring review</caption>
          <thead>
            <tr>
              <th scope="col">Error ID</th>
              <th scope="col">Source</th>
              <th scope="col">Category</th>
              <th scope="col">Error</th>
              <th scope="col">Affected record</th>
              <th scope="col">Severity</th>
              <th scope="col">Occurred at</th>
              <th scope="col">Status</th>
              <th scope="col"><span className="sr-only">Action</span></th>
            </tr>
          </thead>
          <tbody>
            {filteredErrors.map((error) => {
              const currentStatus = displayStatus(error);

              return (
                <tr className={selectedError?.id === error.id ? "is-selected" : ""} key={error.id}>
                  <td>{error.id}</td>
                  <td>{error.source}</td>
                  <td>{error.category}</td>
                  <td className="integration-error-summary">{error.summary}</td>
                  <td>{error.affectedReference}</td>
                  <td><StatusBadge tone={severityTones[error.severity]}>{error.severity}</StatusBadge></td>
                  <td>{error.occurredAt}</td>
                  <td><StatusBadge tone={statusTone(currentStatus)}>{currentStatus}</StatusBadge></td>
                  <td>
                    <ActionButton
                      variant="link"
                      icon="file"
                      action={`${error.id} details opened.`}
                      onAction={() => setSelectedId(error.id)}
                    >
                      Inspect
                    </ActionButton>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredErrors.length === 0 ? <p className="empty-state">No integration errors match the selected filters.</p> : null}
      </div>

      {selectedError ? (
        <section className="integration-error-detail" aria-labelledby="integration-error-detail-title">
          <div className="integration-error-detail-heading">
            <div>
              <p className="section-kicker">Selected error</p>
              <h3 id="integration-error-detail-title">{selectedError.id}</h3>
              <p>{selectedError.summary}</p>
            </div>
            <StatusBadge tone={statusTone(displayStatus(selectedError))}>{displayStatus(selectedError)}</StatusBadge>
          </div>

          <div className="integration-error-detail-grid">
            <dl className="integration-error-facts">
              <div><dt>Source</dt><dd>{selectedError.source}</dd></div>
              <div><dt>Stage</dt><dd>{selectedError.stage}</dd></div>
              <div><dt>Category</dt><dd>{selectedError.category}</dd></div>
              <div><dt>Severity</dt><dd><StatusBadge tone={severityTones[selectedError.severity]}>{selectedError.severity}</StatusBadge></dd></div>
              <div><dt>Occurred at</dt><dd>{selectedError.occurredAt}</dd></div>
              <div><dt>Affected record</dt><dd>{selectedError.affectedReference}</dd></div>
              <div><dt>Resolution</dt><dd>{selectedError.resolutionStatus}</dd></div>
              <div><dt>Retry count</dt><dd>{selectedError.retryCount}{selectedError.lastRetry ? ` · Last retry ${selectedError.lastRetry}` : ""}</dd></div>
              {selectedError.relatedBatch ? <div><dt>Related batch</dt><dd>{selectedError.relatedBatch}</dd></div> : null}
              {selectedError.relatedEmployeeId ? <div><dt>Employee reference</dt><dd>{selectedError.relatedEmployeeId}</dd></div> : null}
              {selectedError.relatedRecordId ? <div><dt>Related record</dt><dd>{selectedError.relatedRecordId}</dd></div> : null}
            </dl>

            <div className="integration-error-timeline">
              <div className="integration-error-subheading">
                <div>
                  <p className="section-kicker">Review trail</p>
                  <h4>Error timeline</h4>
                </div>
                <Icon name="clock" />
              </div>
              <ol>
                {selectedError.timeline.map((event) => (
                  <li key={`${event.time}-${event.event}`}>
                    <span className={`integration-error-timeline-marker status-${event.tone}`} aria-hidden="true" />
                    <div>
                      <strong>{event.event}</strong>
                      <p>{event.detail}</p>
                      <small>{event.time}</small>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="integration-error-message">
            <p className="section-kicker">Technical message</p>
            <p>{selectedError.technicalMessage}</p>
          </div>

          <div className="integration-error-actions">
            {selectedError.retryable ? (
              <ActionButton
                variant="primary"
                icon="refresh"
                action={`${selectedError.id} retry queued for frontend simulation.`}
                onAction={() => queueRetry(selectedError)}
              >
                Retry error
              </ActionButton>
            ) : <StatusBadge tone="warning">Review required</StatusBadge>}
            {selectedError.status !== "Resolved" && !acknowledgedIds.includes(selectedError.id) ? (
              <ActionButton
                icon="check"
                action={`${selectedError.id} acknowledged for frontend simulation.`}
                onAction={() => acknowledge(selectedError)}
              >
                Acknowledge
              </ActionButton>
            ) : null}
            {acknowledgedIds.includes(selectedError.id) ? <StatusBadge tone="info">Acknowledged</StatusBadge> : null}
            <Link className="button-link integration-error-source-link" href={sourceHref(selectedError.source)}>
              View source integration
              <Icon name="arrow" />
            </Link>
          </div>
          <p className="integration-error-detail-note"><Icon name="info" /> Retry and acknowledgement actions update this prototype only; no external system is contacted.</p>
        </section>
      ) : (
        <div className="integration-error-detail integration-error-detail-empty">
          <Icon name="filter" />
          <h3>No error selected</h3>
          <p>Clear a filter or choose another search to inspect an integration error.</p>
        </div>
      )}
    </div>
  );
}
