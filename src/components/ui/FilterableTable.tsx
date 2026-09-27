"use client";

import { useMemo, useState } from "react";

type TableRow = Record<string, string>;

type FilterDefinition = {
  key: string;
  label: string;
  options: string[];
};

type FilterableTableProps = {
  rows: readonly TableRow[];
  columns: Array<{ key: string; label: string }>;
  filters?: FilterDefinition[];
  searchPlaceholder?: string;
  caption: string;
  emptyMessage: string;
  note?: string;
};

function toneFor(value: string) {
  const normalized = value.toLowerCase();

  if (["success", "online", "processed", "matched", "valid", "updated", "on time", "active", "resolved"].includes(normalized)) {
    return "success";
  }

  if (normalized === "low") {
    return "info";
  }

  if (["failed", "rejected", "inactive employee", "error", "open", "critical", "high"].includes(normalized)) {
    return "danger";
  }

  if (["warning", "pending", "needs review", "under review", "retry pending", "unmatched", "duplicate", "not ready", "missing time-in", "missing time-out", "medium"].includes(normalized)) {
    return "warning";
  }

  return "muted";
}

export function FilterableTable({
  rows,
  columns,
  filters = [],
  searchPlaceholder = "Search records",
  caption,
  emptyMessage,
  note,
}: FilterableTableProps) {
  const [search, setSearch] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({});

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch = !query || Object.values(row).some((value) => value.toLowerCase().includes(query));
      const matchesFilters = filters.every((filter) => {
        const selected = selectedFilters[filter.key];
        return !selected || selected === "All" || row[filter.key] === selected;
      });

      return matchesSearch && matchesFilters;
    });
  }, [filters, rows, search, selectedFilters]);

  return (
    <>
      <div className="filter-toolbar">
        <label className="field field-search">
          <span>{searchPlaceholder}</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={searchPlaceholder} />
        </label>
        {filters.map((filter) => (
          <label className="field" key={filter.key}>
            <span>{filter.label}</span>
            <select
              value={selectedFilters[filter.key] ?? "All"}
              onChange={(event) => setSelectedFilters((current) => ({ ...current, [filter.key]: event.target.value }))}
            >
              {filter.options.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <div className="table-meta">
        <span>Showing {filteredRows.length} of {rows.length} records</span>
        {note ? <span>{note}</span> : null}
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              {columns.map((column) => <th key={column.key}>{column.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, rowIndex) => (
              <tr key={`${row[columns[0]?.key] ?? "row"}-${rowIndex}`}>
                {columns.map((column) => {
                  const value = row[column.key] ?? "—";
                  const isStatus = ["status", "severity", "tone", "match", "processing", "validation", "result", "employment"].includes(column.key);

                  return (
                    <td key={column.key}>
                      {isStatus && value !== "—" ? <span className={`inline-status status-${toneFor(value)}`}>{value}</span> : value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {filteredRows.length === 0 ? <p className="empty-state">{emptyMessage}</p> : null}
      </div>
    </>
  );
}
