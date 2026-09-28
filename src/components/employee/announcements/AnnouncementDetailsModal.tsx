"use client";

import { useEffect, useRef } from "react";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { EmployeeAnnouncement } from "@/data/employee";

type AnnouncementDetailsModalProps = {
  announcement: EmployeeAnnouncement | null;
  onClose: () => void;
};

export function AnnouncementDetailsModal({ announcement, onClose }: AnnouncementDetailsModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!announcement) {
      return;
    }

    closeButtonRef.current?.focus();

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => window.removeEventListener("keydown", handleEscape);
  }, [announcement, onClose]);

  if (!announcement) {
    return null;
  }

  return (
    <div className="employee-announcement-modal-layer">
      <button
        type="button"
        className="employee-announcement-modal-backdrop"
        onClick={onClose}
        aria-label="Close announcement details"
      />
      <section
        className="employee-announcement-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="employee-announcement-modal-title"
      >
        <header className="employee-announcement-modal-header">
          <div>
            <span className="employee-announcements-heading-label">Announcement</span>
            <div className="employee-announcement-modal-meta">
              <StatusBadge tone={announcement.tone}>{announcement.category}</StatusBadge>
              <time dateTime={announcement.postedAt}>{announcement.date}</time>
            </div>
          </div>
          <button
            type="button"
            className="employee-announcement-modal-close"
            onClick={onClose}
            ref={closeButtonRef}
            aria-label="Close announcement details"
          >
            <Icon name="close" />
          </button>
        </header>

        <div className="employee-announcement-modal-body">
          <h2 id="employee-announcement-modal-title">{announcement.title}</h2>
          <p>{announcement.message}</p>
        </div>

        <footer className="employee-announcement-modal-footer">
          <button type="button" className="employee-secondary-button" onClick={onClose}>
            Close
          </button>
        </footer>
      </section>
    </div>
  );
}
