"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import { Icon } from "@/components/ui/Icon";
import {
  employeeSupportConcernOptions,
  type EmployeeSupportConcernType,
} from "@/data/employee-help";

type SupportField = "concernType" | "subject" | "description";

type SupportErrors = Partial<Record<SupportField, string>>;

type SubmittedSupportRequest = {
  reference: string;
  destination: string;
};

export function SupportRequestSection() {
  const [concernType, setConcernType] = useState<EmployeeSupportConcernType | "">("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<SupportErrors>({});
  const [submittedRequest, setSubmittedRequest] = useState<SubmittedSupportRequest | null>(
    null,
  );

  const selectedConcern = employeeSupportConcernOptions.find(
    (option) => option.value === concernType,
  );

  function clearFieldError(field: SupportField) {
    setErrors((currentErrors) => {
      if (!currentErrors[field]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[field];
      return nextErrors;
    });
    setSubmittedRequest(null);
  }

  function handleConcernTypeChange(value: EmployeeSupportConcernType | "") {
    setConcernType(value);
    clearFieldError("concernType");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: SupportErrors = {};

    if (!selectedConcern) {
      nextErrors.concernType = "Please select a concern type.";
    }

    if (!subject.trim()) {
      nextErrors.subject = "Please enter a subject.";
    }

    if (!description.trim()) {
      nextErrors.description = "Please describe your concern.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setSubmittedRequest(null);
      return;
    }

    setErrors({});
    setSubmittedRequest({
      reference: "SUP-2026-00124",
      destination: selectedConcern?.destination ?? "HR / Appropriate Staff",
    });
    setSubject("");
    setDescription("");
  }

  return (
    <section
      className="employee-help-section employee-help-request"
      aria-labelledby="employee-help-request-title"
    >
      <div className="employee-help-section-heading">
        <div>
          <span className="employee-help-section-kicker">Get support</span>
          <h2 id="employee-help-request-title">Submit a Concern</h2>
        </div>
        <span className="employee-help-section-note">Employee support</span>
      </div>

      <div className="employee-help-request-body">
        <p className="employee-help-request-intro">
          Tell us what you need help with and your concern will be directed to
          the appropriate support team.
        </p>

        <form className="employee-help-form" onSubmit={handleSubmit} noValidate>
          <div className="employee-help-form-grid">
            <div className="employee-help-field">
              <label htmlFor="employee-help-concern-type">Concern Type</label>
              <select
                id="employee-help-concern-type"
                value={concernType}
                required
                onChange={(event) =>
                  handleConcernTypeChange(
                    event.target.value as EmployeeSupportConcernType | "",
                  )
                }
                aria-invalid={Boolean(errors.concernType)}
                aria-describedby={
                  errors.concernType
                    ? "employee-help-concern-type-error"
                    : undefined
                }
              >
                <option value="">Select concern type</option>
                {employeeSupportConcernOptions.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.concernType ? (
                <span
                  className="employee-help-field-error"
                  id="employee-help-concern-type-error"
                >
                  {errors.concernType}
                </span>
              ) : null}
            </div>

            <div className="employee-help-field">
              <label htmlFor="employee-help-subject">Subject</label>
              <input
                id="employee-help-subject"
                type="text"
                value={subject}
                maxLength={120}
                required
                onChange={(event) => {
                  setSubject(event.target.value);
                  clearFieldError("subject");
                }}
                placeholder="Brief summary of your concern"
                aria-invalid={Boolean(errors.subject)}
                aria-describedby={
                  errors.subject ? "employee-help-subject-error" : undefined
                }
              />
              {errors.subject ? (
                <span
                  className="employee-help-field-error"
                  id="employee-help-subject-error"
                >
                  {errors.subject}
                </span>
              ) : null}
            </div>
          </div>

          <div className="employee-help-field">
            <label htmlFor="employee-help-description">Describe your concern</label>
            <textarea
              id="employee-help-description"
              value={description}
              maxLength={1000}
              required
              onChange={(event) => {
                setDescription(event.target.value);
                clearFieldError("description");
              }}
              placeholder="Explain what happened or what you need help with."
              rows={4}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={
                errors.description
                  ? "employee-help-description-error"
                  : undefined
              }
            />
            {errors.description ? (
              <span
                className="employee-help-field-error"
                id="employee-help-description-error"
              >
                {errors.description}
              </span>
            ) : null}
          </div>

          {selectedConcern ? (
            <div className="employee-help-request-routing" aria-live="polite">
              <span className="employee-help-request-routing-icon" aria-hidden="true">
                <Icon name="support" />
              </span>
              <div>
                <span className="employee-help-request-routing-label">Directed to</span>
                <strong>{selectedConcern.destination}</strong>
                <p>{selectedConcern.guidance}</p>
              </div>
            </div>
          ) : (
            <p className="employee-help-request-routing-empty">
              Select a concern type to see the responsible support group.
            </p>
          )}

          {selectedConcern?.value === "attendance" ? (
            <p className="employee-help-request-attendance-note">
              For changes to an attendance record, use the separate attendance
              correction workflow. Use this form for questions or support
              regarding attendance. {" "}
              <a href="#attendance-corrections">Read the correction guide</a>
            </p>
          ) : null}

          <div className="employee-help-request-footer">
            <span className="employee-help-request-prototype-note">
              Prototype submission only; no external support system is contacted.
            </span>
            <button type="submit" className="employee-help-submit">
              Submit Concern
              <Icon name="arrow" />
            </button>
          </div>
        </form>

        {submittedRequest ? (
          <div className="employee-help-success" role="status" aria-live="polite">
            <strong>Concern submitted successfully.</strong>
            <span>
              Reference: {submittedRequest.reference} · Directed to: {submittedRequest.destination}
            </span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
