"use client";

import { useCallback, useMemo, useState } from "react";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  type EmployeeAnnouncement,
  type EmployeeAnnouncementCategory,
} from "@/data/employee";

import { AnnouncementDetailsModal } from "./AnnouncementDetailsModal";

type AnnouncementFilter = "All" | EmployeeAnnouncementCategory;

type AnnouncementsExplorerProps = {
  announcements: readonly EmployeeAnnouncement[];
};

const categoryFilters: Array<{ value: AnnouncementFilter; label: string }> = [
  { value: "All", label: "All" },
  { value: "Payroll", label: "Payroll" },
  { value: "Notice", label: "Notice" },
  { value: "Reminder", label: "Reminder" },
];

export function AnnouncementsExplorer({ announcements }: AnnouncementsExplorerProps) {
  const [selectedCategory, setSelectedCategory] = useState<AnnouncementFilter>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<EmployeeAnnouncement | null>(null);
  const closeAnnouncement = useCallback(() => {
    setSelectedAnnouncement(null);
  }, []);

  const filteredAnnouncements = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();

    return [...announcements]
      .filter((announcement) => {
        const matchesCategory = selectedCategory === "All"
          || announcement.category === selectedCategory;
        const searchableText = [
          announcement.title,
          announcement.message,
          announcement.category,
        ].join(" ").toLowerCase();
        const matchesSearch = !search || searchableText.includes(search);

        return matchesCategory && matchesSearch;
      })
      .sort((left, right) => right.postedAt.localeCompare(left.postedAt));
  }, [announcements, searchQuery, selectedCategory]);

  const hasFilters = selectedCategory !== "All" || searchQuery.trim().length > 0;

  function clearFilters() {
    setSelectedCategory("All");
    setSearchQuery("");
  }

  function getEmptyMessage() {
    if (searchQuery.trim()) {
      return "No announcements match your search.";
    }

    if (selectedCategory !== "All") {
      return "No announcements are available in this category.";
    }

    return "No announcements are currently available.";
  }

  return (
    <div className="employee-announcements-explorer">
      <section className="employee-announcements-toolbar" aria-label="Announcement filters">
        <div className="employee-announcement-filter-group" role="group" aria-label="Filter announcements by category">
          {categoryFilters.map((filter) => {
            const isSelected = selectedCategory === filter.value;

            return (
              <button
                type="button"
                className={`employee-announcement-filter ${isSelected ? "is-selected" : ""}`}
                key={filter.value}
                onClick={() => setSelectedCategory(filter.value)}
                aria-pressed={isSelected}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        <label className="employee-announcement-search">
          <span className="sr-only">Search announcements</span>
          <Icon name="search" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search announcements"
            aria-label="Search announcements"
          />
        </label>
      </section>

      <div className="employee-announcements-result-bar">
        <p role="status" aria-live="polite">
          Showing {filteredAnnouncements.length} of {announcements.length} announcements
        </p>
        {hasFilters ? (
          <button type="button" className="employee-announcements-clear" onClick={clearFilters}>
            Clear filters
          </button>
        ) : null}
      </div>

      {filteredAnnouncements.length > 0 ? (
        <section className="employee-announcements-list" aria-label="Available announcements">
          {filteredAnnouncements.map((announcement) => (
            <article className="employee-announcement-item" key={announcement.id}>
              <div className={`announcement-icon ${announcement.tone}`} aria-hidden="true">
                <Icon name="info" />
              </div>
              <div className="employee-announcement-copy">
                <div className="employee-announcement-meta">
                  <StatusBadge tone={announcement.tone}>{announcement.category}</StatusBadge>
                  <time dateTime={announcement.postedAt}>{announcement.date}</time>
                </div>
                <h2>{announcement.title}</h2>
                <p>{announcement.message}</p>
                <button
                  type="button"
                  className="employee-announcement-detail-button"
                  onClick={() => setSelectedAnnouncement(announcement)}
                  aria-label={`View details for ${announcement.title}`}
                >
                  View details
                  <Icon name="arrow" />
                </button>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="employee-announcements-empty" aria-live="polite">
          <Icon name="info" />
          <p>{getEmptyMessage()}</p>
          {hasFilters ? (
            <button type="button" className="employee-announcements-clear" onClick={clearFilters}>
              Clear filters
            </button>
          ) : null}
        </section>
      )}

      <AnnouncementDetailsModal
        announcement={selectedAnnouncement}
        onClose={closeAnnouncement}
      />
    </div>
  );
}
