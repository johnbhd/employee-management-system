"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { apiRequest } from "@/lib/api/client";
import { formatCampusDateKeyLabel, formatCampusTime } from "@/lib/campus-time";
import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
    hrAttendanceReviewPageSizes,
    type HrAttendanceReviewQuery,
} from "@/server/hr/attendance-review-query";
import type {
    HrAttendanceReviewData,
    HrAttendanceReviewRecord,
    HrReviewCorrection,
} from "@/types/hr-attendance-review";

type ExplorerProps = {
    data: HrAttendanceReviewData;
    query: HrAttendanceReviewQuery;
    loadError: boolean;
};

type Decision = "approve" | "reject";

const technicalStateOptions = [
    ["", "All technical states"],
    ["MISSING_IN", "Missing Time-In"],
    ["MISSING_OUT", "Missing Time-Out"],
    ["NEEDS_REVIEW", "Needs review"],
    ["COMPLETE", "Complete"],
    ["NO_EVENTS", "No events"],
] as const;

const businessStatusOptions = [
    ["", "All attendance states"],
    ["UNCLASSIFIED", "Unclassified"],
    ["PRESENT", "Present"],
    ["LATE", "Late"],
    ["ABSENT", "Absent"],
] as const;

const issueTypeOptions = [
    ["Missing Time-In", "Missing Time-In"],
    ["Missing Time-Out", "Missing Time-Out"],
    ["Incorrect Time-In", "Incorrect Time-In"],
    ["Incorrect Time-Out", "Incorrect Time-Out"],
    ["Time In and Time Out Correction", "Time In and Time Out"],
] as const;

function formatTime(value: string | null) {
    return value ? formatCampusTime(new Date(value)) : "—";
}

function formatDate(value: string) {
    return formatCampusDateKeyLabel(value, "short");
}

function readable(value: string) {
    return value
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/(^| )\w/g, (letter) => letter.toUpperCase());
}

function technicalTone(value: string) {
    if (value === "COMPLETE") return "success" as const;
    if (value === "MISSING_IN" || value === "MISSING_OUT" || value === "NEEDS_REVIEW") {
        return "warning" as const;
    }
    if (value === "NO_EVENTS") return "danger" as const;
    return "info" as const;
}

function correctionTone(status: HrReviewCorrection["status"]) {
    if (status === "approved") return "success" as const;
    if (status === "rejected") return "danger" as const;
    return "warning" as const;
}

function toLocalDateTime(value: string | null) {
    if (!value) return "";
    const date = new Date(value);
    const pad = (part: number) => String(part).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toQueryString(values: Record<string, string | number>) {
    const params = new URLSearchParams();
    Object.entries(values).forEach(([key, value]) => {
        if (String(value)) params.set(key, String(value));
    });
    return params.toString();
}

function statusLabel(record: HrAttendanceReviewRecord) {
    if (record.verification.status === "verified") return "Final verified";
    if (record.corrections.some((correction) => correction.status === "pending")) return "Correction pending";
    if (record.effective.timeIn && record.effective.timeOut) return "Ready for verification";
    return "Needs HR review";
}

function statusTone(record: HrAttendanceReviewRecord) {
    if (record.verification.status === "verified") return "success" as const;
    if (record.corrections.some((correction) => correction.status === "pending")) return "warning" as const;
    if (record.effective.timeIn && record.effective.timeOut) return "info" as const;
    return "danger" as const;
}

export function HrAttendanceReviewExplorer({ data, query, loadError }: ExplorerProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [search, setSearch] = useState(query.search);
    const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
    const [correctionOpen, setCorrectionOpen] = useState(false);
    const [decision, setDecision] = useState<{ correctionId: string; action: Decision } | null>(null);
    const [decisionNote, setDecisionNote] = useState("");
    const [feedback, setFeedback] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const selectedRecord = data.records.find((record) => record.id === selectedRecordId) ?? null;
    const selectedPendingCorrection = selectedRecord?.corrections.find(
        (correction) => correction.status === "pending",
    ) ?? null;

    useEffect(() => {
        if (!selectedRecordId && !correctionOpen && !decision) return;

        function closeOnEscape(event: KeyboardEvent) {
            if (event.key !== "Escape" || isSubmitting) return;
            setCorrectionOpen(false);
            setDecision(null);
            setSelectedRecordId(null);
            setDecisionNote("");
        }

        document.addEventListener("keydown", closeOnEscape);
        return () => document.removeEventListener("keydown", closeOnEscape);
    }, [correctionOpen, decision, isSubmitting, selectedRecordId]);

    const activeFilterCount = [
        query.search,
        query.employeeId,
        query.department,
        query.fromDate,
        query.toDate,
        query.technicalState,
        query.businessStatus,
        query.reviewState === "all" ? "" : query.reviewState,
        query.correctionStatus,
        query.verificationStatus,
    ].filter(Boolean).length;
    const firstVisible = data.total === 0 ? 0 : (data.page - 1) * data.pageSize + 1;
    const lastVisible = Math.min(data.page * data.pageSize, data.total);

    const employeeOptions = useMemo(
        () => [
            ["", "All employees"] as const,
            ...data.employees.map((employee) => [
                employee.employeeId,
                `${employee.displayName} (${employee.employeeId})`,
            ] as const),
        ],
        [data.employees],
    );

    function navigate(values: Partial<Record<keyof HrAttendanceReviewQuery, string | number>>) {
        const next = {
            search,
            employeeId: query.employeeId ?? "",
            department: query.department ?? "",
            fromDate: query.fromDate ?? "",
            toDate: query.toDate ?? "",
            technicalState: query.technicalState ?? "",
            businessStatus: query.businessStatus ?? "",
            reviewState: query.reviewState,
            correctionStatus: query.correctionStatus ?? "",
            verificationStatus: query.verificationStatus ?? "",
            pageSize: query.pageSize,
            page: 1,
            ...values,
        };
        const queryString = toQueryString(next);
        router.push(queryString ? `${pathname}?${queryString}` : pathname);
    }

    function resetFilters() {
        router.push(pathname);
    }

    function closeDetails() {
        if (isSubmitting) return;
        setCorrectionOpen(false);
        setDecision(null);
        setSelectedRecordId(null);
        setDecisionNote("");
    }

    async function submitCorrection(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!selectedRecord || isSubmitting) return;
        const form = new FormData(event.currentTarget);
        setIsSubmitting(true);
        setError("");
        setFeedback("");

        try {
            await apiRequest(`/api/hr/attendance-review/${encodeURIComponent(selectedRecord.id)}/corrections`, {
                method: "POST",
                body: JSON.stringify({
                    issueType: form.get("issueType"),
                    correctedTimeIn: form.get("correctedTimeIn")
                        ? new Date(String(form.get("correctedTimeIn"))).toISOString()
                        : null,
                    correctedTimeOut: form.get("correctedTimeOut")
                        ? new Date(String(form.get("correctedTimeOut"))).toISOString()
                        : null,
                    reason: form.get("reason"),
                    remarks: form.get("remarks"),
                }),
            });
            setFeedback("Correction created and is awaiting HR decision.");
            setCorrectionOpen(false);
            router.refresh();
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "The correction could not be created.");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function submitDecision() {
        if (!decision || isSubmitting) return;
        setIsSubmitting(true);
        setError("");
        setFeedback("");

        try {
            await apiRequest(`/api/hr/attendance-corrections/${encodeURIComponent(decision.correctionId)}`, {
                method: "POST",
                body: JSON.stringify({
                    decision: decision.action,
                    reviewNote: decisionNote.trim() || null,
                }),
            });
            setFeedback(decision.action === "approve"
                ? "Correction approved. The effective attendance changed, but final verification is still required."
                : "Correction rejected. Original attendance remains effective.");
            setDecision(null);
            setDecisionNote("");
            router.refresh();
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "The correction decision could not be completed.");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function finalVerify() {
        if (!selectedRecord || isSubmitting) return;
        setIsSubmitting(true);
        setError("");
        setFeedback("");

        try {
            await apiRequest(`/api/hr/attendance-review/${encodeURIComponent(selectedRecord.id)}/final-verify`, {
                method: "POST",
            });
            setFeedback("Attendance was final-verified for Payroll readiness.");
            router.refresh();
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "Final verification could not be completed.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="hr-attendance-review-explorer">
            <section className="hr-review-summary" aria-label="Attendance review summary">
                <Metric label="Needs review" value={data.summary.needsReview} tone="warning" icon="warning" />
                <Metric label="Missing Time-In" value={data.summary.missingIn} tone="danger" icon="clock" />
                <Metric label="Missing Time-Out" value={data.summary.missingOut} tone="warning" icon="clock" />
                <Metric label="Pending corrections" value={data.summary.pendingCorrections} tone="info" icon="comment" />
                <Metric label="Ready for verification" value={data.summary.readyForVerification} tone="info" icon="check" />
                <Metric label="Final verified" value={data.summary.finalVerified} tone="success" icon="shield" />
            </section>

            <form
                className="hr-review-filter-panel"
                onSubmit={(event) => {
                    event.preventDefault();
                    navigate({ search, page: 1 });
                }}
            >
                <div className="hr-review-filter-heading">
                    <div>
                        <p className="hr-section-kicker">Canonical attendance</p>
                        <h2>Review filters</h2>
                    </div>
                    <span>{activeFilterCount ? `${activeFilterCount} filters active` : "Needs-review records"}</span>
                </div>
                <div className="hr-review-filter-grid">
                    <label className="hr-review-field hr-review-search-field">
                        <span>Search employee</span>
                        <span className="hr-review-input-wrap">
                            <Icon name="search" />
                            <input
                                type="search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Name, ID, or department"
                            />
                        </span>
                    </label>
                    <SelectField
                        label="Employee"
                        value={query.employeeId ?? ""}
                        options={employeeOptions}
                        onChange={(value) => navigate({ employeeId: value })}
                    />
                    <SelectField
                        label="Department"
                        value={query.department ?? ""}
                        options={[
                            ["", "All departments"] as const,
                            ...data.departments.map((value) => [value, value] as const),
                        ]}
                        onChange={(value) => navigate({ department: value })}
                    />
                    <label className="hr-review-field">
                        <span>Date from</span>
                        <input
                            type="date"
                            value={query.fromDate ?? ""}
                            onChange={(event) => navigate({ fromDate: event.target.value })}
                        />
                    </label>
                    <label className="hr-review-field">
                        <span>Date to</span>
                        <input
                            type="date"
                            value={query.toDate ?? ""}
                            onChange={(event) => navigate({ toDate: event.target.value })}
                        />
                    </label>
                    <SelectField
                        label="Technical state"
                        value={query.technicalState ?? ""}
                        options={technicalStateOptions}
                        onChange={(value) => navigate({ technicalState: value })}
                    />
                    <SelectField
                        label="Attendance state"
                        value={query.businessStatus ?? ""}
                        options={businessStatusOptions}
                        onChange={(value) => navigate({ businessStatus: value })}
                    />
                    <SelectField
                        label="Review scope"
                        value={query.reviewState}
                        options={[["needs-review", "Needs review"], ["all", "All records"]]}
                        onChange={(value) => navigate({ reviewState: value })}
                    />
                    <SelectField
                        label="Correction"
                        value={query.correctionStatus ?? ""}
                        options={[["", "All corrections"], ["pending", "Pending"], ["approved", "Approved"], ["rejected", "Rejected"]]}
                        onChange={(value) => navigate({ correctionStatus: value })}
                    />
                    <SelectField
                        label="Verification"
                        value={query.verificationStatus ?? ""}
                        options={[["", "All verification"], ["pending", "Pending"], ["verified", "Final verified"]]}
                        onChange={(value) => navigate({ verificationStatus: value })}
                    />
                </div>
                <div className="hr-review-filter-footer">
                    <span>Raw Bundy and QR evidence remain read-only.</span>
                    <button
                        type="button"
                        className="button-secondary"
                        onClick={resetFilters}
                    >
                        <Icon name="refresh" />
                        Reset filters
                    </button>
                </div>
            </form>

            <section className="hr-dashboard-panel hr-review-records" aria-labelledby="hr-review-records-heading">
                <div className="hr-panel-header">
                    <div>
                        <p className="hr-section-kicker">HR decision workspace</p>
                        <h2 id="hr-review-records-heading">Attendance records</h2>
                        <p className="hr-panel-description">
                            Inspect original processing, effective values, evidence, correction history, and verification status.
                        </p>
                    </div>
                    <span className="hr-review-result-count">
                        {loadError
                            ? "Records unavailable"
                            : `Showing ${firstVisible}-${lastVisible} of ${data.total} records`}
                    </span>
                </div>

                {loadError ? (
                    <div className="hr-review-empty" role="alert">
                        <p>Attendance review could not be loaded.</p>
                        <button
                            type="button"
                            className="button-secondary"
                            onClick={() => router.refresh()}
                        >
                            Try again
                        </button>
                    </div>
                ) : (
                    <ReviewTable records={data.records} onSelect={setSelectedRecordId} />
                )}

                <div className="hr-review-table-footer">
                    <label>
                        <span>Rows per page</span>
                        <select
                            value={query.pageSize}
                            onChange={(event) => navigate({
                                pageSize: Number(event.target.value),
                                page: 1,
                            })}
                        >
                            {hrAttendanceReviewPageSizes.map((size) => (
                                <option key={size} value={size}>{size}</option>
                            ))}
                        </select>
                    </label>
                    <div className="hr-review-pagination">
                        <button
                            type="button"
                            className="button-secondary"
                            onClick={() => navigate({ page: Math.max(1, query.page - 1) })}
                            disabled={query.page <= 1}
                        >
                            Previous
                        </button>
                        <span>Page {data.page}</span>
                        <button
                            type="button"
                            className="button-secondary"
                            onClick={() => navigate({ page: query.page + 1 })}
                            disabled={!data.hasNext}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </section>

            {feedback ? <p className="hr-review-feedback" role="status" aria-live="polite">{feedback}</p> : null}
            {error ? <p className="hr-review-feedback is-error" role="alert">{error}</p> : null}

            {selectedRecord ? (
                <ReviewDrawer
                    record={selectedRecord}
                    canReview={data.permissions.canReviewCorrections}
                    canVerify={data.permissions.canVerifyAttendance}
                    pendingCorrection={selectedPendingCorrection}
                    onClose={closeDetails}
                    onCreateCorrection={() => { setError(""); setCorrectionOpen(true); }}
                    onDecision={(action, correctionId) => { setError(""); setDecision({ action, correctionId }); }}
                    onFinalVerify={finalVerify}
                    isSubmitting={isSubmitting}
                />
            ) : null}

            {correctionOpen && selectedRecord ? <CorrectionDialog record={selectedRecord} isSubmitting={isSubmitting} onClose={() => setCorrectionOpen(false)} onSubmit={submitCorrection} /> : null}
            {decision ? <DecisionDialog decision={decision.action} note={decisionNote} isSubmitting={isSubmitting} onNoteChange={setDecisionNote} onClose={() => setDecision(null)} onConfirm={submitDecision} /> : null}
        </div>
    );
}

function Metric({
    label,
    value,
    tone,
    icon,
}: {
    label: string;
    value: number;
    tone: "success" | "warning" | "danger" | "info";
    icon: "warning" | "clock" | "comment" | "check" | "shield";
}) {
    return (
        <article className={`hr-review-metric hr-review-metric-${tone}`}>
            <span aria-hidden="true">
                <Icon name={icon} />
            </span>
            <div>
                <span>{label}</span>
                <strong>{value}</strong>
            </div>
        </article>
    );
}

function SelectField({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value: string;
    options: readonly (readonly [string, string])[];
    onChange: (value: string) => void;
}) {
    return (
        <label className="hr-review-field">
            <span>{label}</span>
            <select value={value} onChange={(event) => onChange(event.target.value)}>
                {options.map(([optionValue, optionLabel]) => (
                    <option key={optionValue} value={optionValue}>
                        {optionLabel}
                    </option>
                ))}
            </select>
        </label>
    );
}

function ReviewTable({
    records,
    onSelect,
}: {
    records: readonly HrAttendanceReviewRecord[];
    onSelect: (id: string) => void;
}) {
    return (
        <div className="hr-review-table-scroll">
            <table className="hr-review-table">
                <caption className="sr-only">HR attendance review records</caption>
                <thead>
                    <tr>
                        <th scope="col">Employee</th>
                        <th scope="col">Date</th>
                        <th scope="col">Schedule</th>
                        <th scope="col">Original IN / OUT</th>
                        <th scope="col">Effective IN / OUT</th>
                        <th scope="col">Technical</th>
                        <th scope="col">Review</th>
                        <th scope="col">Verification</th>
                        <th scope="col">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {records.map((record) => (
                        <tr key={record.id}>
                            <td>
                                <strong>{record.employee.displayName}</strong>
                                <small>{record.employee.employeeId} · {record.employee.department}</small>
                            </td>
                            <td>{formatDate(record.attendanceDate)}</td>
                            <td>
                                {record.schedule
                                    ? `${record.schedule.workStart ?? "—"}–${record.schedule.workEnd ?? "—"}`
                                    : "No schedule"}
                            </td>
                            <td>
                                <span>{formatTime(record.original.timeIn)}</span>
                                <small>{formatTime(record.original.timeOut)}</small>
                            </td>
                            <td>
                                <span>{formatTime(record.effective.timeIn)}</span>
                                <small>{formatTime(record.effective.timeOut)}</small>
                            </td>
                            <td>
                                <StatusBadge tone={technicalTone(record.original.technicalState)}>
                                    {readable(record.original.technicalState)}
                                </StatusBadge>
                            </td>
                            <td>
                                <StatusBadge tone={statusTone(record)}>{statusLabel(record)}</StatusBadge>
                            </td>
                            <td>
                                <StatusBadge tone={record.verification.status === "verified" ? "success" : "muted"}>
                                    {readable(record.verification.status)}
                                </StatusBadge>
                            </td>
                            <td>
                                <button
                                    type="button"
                                    className="button-secondary"
                                    onClick={() => onSelect(record.id)}
                                >
                                    <Icon name="file" />
                                    Review
                                </button>
                            </td>
                        </tr>
                    ))}
                    {records.length === 0 ? (
                        <tr>
                            <td colSpan={9} className="hr-review-empty-row">
                                No attendance records match the selected review filters.
                            </td>
                        </tr>
                    ) : null}
                </tbody>
            </table>
        </div>
    );
}

function ReviewDrawer({ record, canReview, canVerify, pendingCorrection, onClose, onCreateCorrection, onDecision, onFinalVerify, isSubmitting }: { record: HrAttendanceReviewRecord; canReview: boolean; canVerify: boolean; pendingCorrection: HrReviewCorrection | null; onClose: () => void; onCreateCorrection: () => void; onDecision: (action: Decision, correctionId: string) => void; onFinalVerify: () => void; isSubmitting: boolean }) {
    const approvedCorrection = record.corrections.find((correction) => correction.status === "approved");
    const canCreate = canReview && record.verification.status !== "verified" && !record.corrections.some((correction) => correction.status === "pending" || correction.status === "approved");
    const canVerifyNow = canVerify && record.verification.status !== "verified" && !pendingCorrection && Boolean(record.effective.timeIn && record.effective.timeOut);

    return <div className="hr-review-drawer-layer"><button type="button" className="hr-review-backdrop" onClick={onClose} aria-label="Close attendance review" /><aside className="hr-review-drawer" role="dialog" aria-modal="true" aria-labelledby="hr-review-drawer-title"><header className="hr-review-drawer-header"><div><p className="hr-section-kicker">Attendance review</p><h2 id="hr-review-drawer-title">{record.employee.displayName}</h2><span>{record.employee.employeeId} · {formatDate(record.attendanceDate)}</span></div><button type="button" className="hr-review-close" onClick={onClose} autoFocus aria-label="Close attendance review"><Icon name="close" /></button></header><ReviewSection title="Employee context"><Detail label="Department" value={record.employee.department} /><Detail label="Position" value={record.employee.position ?? "Not provided"} /><Detail label="Date" value={formatDate(record.attendanceDate)} /></ReviewSection><ReviewSection title="Official schedule"><Detail label="Schedule" value={record.schedule ? `${record.schedule.scheduleId}${record.schedule.shiftLabel ? ` · ${record.schedule.shiftLabel}` : ""}` : "No official schedule resolved"} /><Detail label="Hours" value={record.schedule ? `${record.schedule.workStart ?? "—"}–${record.schedule.workEnd ?? "—"}` : "—"} /><Detail label="Work days" value={record.schedule?.workDays.join(", ") || "—"} /></ReviewSection><ReviewSection title="Original processed attendance"><Detail label="Time-In" value={`${formatTime(record.original.timeIn)} · ${record.original.timeInSource ?? "No source"}`} /><Detail label="Time-Out" value={`${formatTime(record.original.timeOut)} · ${record.original.timeOutSource ?? "No source"}`} /><Detail label="Technical state" value={<StatusBadge tone={technicalTone(record.original.technicalState)}>{readable(record.original.technicalState)}</StatusBadge>} /><Detail label="Review reason" value={record.original.reviewReasonCode ?? "No review flag"} /></ReviewSection><ReviewSection title="Effective attendance"><Detail label="Effective Time-In" value={formatTime(record.effective.timeIn)} /><Detail label="Effective Time-Out" value={formatTime(record.effective.timeOut)} /><Detail label="Verification" value={<StatusBadge tone={record.verification.status === "verified" ? "success" : "warning"}>{record.verification.status === "verified" ? `Verified by ${record.verification.verifiedBy ?? "HR"}` : "Pending final verification"}</StatusBadge>} /></ReviewSection><ReviewSection title="Source evidence"><div className="hr-review-evidence-list">{record.evidence.length ? record.evidence.map((evidence) => <div className="hr-review-evidence" key={evidence.id}><span>{formatTime(evidence.occurredAt)}</span><strong>{evidence.source} · {evidence.direction}</strong><small>{evidence.reference}</small></div>) : <p className="hr-review-muted">No source evidence is linked.</p>}</div></ReviewSection><ReviewSection title="Correction history"><div className="hr-review-correction-list">{record.corrections.length ? record.corrections.map((correction) => <article className="hr-review-correction" key={correction.id}><div className="hr-review-correction-heading"><strong>{correction.issueType}</strong><StatusBadge tone={correctionTone(correction.status)}>{readable(correction.status)}</StatusBadge></div><p>{correction.reason}</p>{correction.remarks ? <small>Remarks: {correction.remarks}</small> : null}<small>Submitted by {correction.submittedBy} · {new Date(correction.submittedAt).toLocaleString()}</small>{correction.reviewNote ? <small>Decision note: {correction.reviewNote}</small> : null}{correction.status === "pending" && canReview ? <div className="hr-review-action-row"><button type="button" className="button-secondary" onClick={() => onDecision("reject", correction.id)} disabled={isSubmitting}>Reject</button><button type="button" className="button-primary" onClick={() => onDecision("approve", correction.id)} disabled={isSubmitting}>Approve</button></div> : null}</article>) : <p className="hr-review-muted">No correction history. A complete record can be final-verified without a correction.</p>}</div></ReviewSection><div className="hr-review-drawer-footer">{canCreate ? <button type="button" className="button-secondary" onClick={onCreateCorrection}>Create correction</button> : null}{approvedCorrection ? <span className="hr-review-note">Approved correction is effective; final verification remains explicit.</span> : null}{canVerifyNow ? <button type="button" className="button-primary" onClick={onFinalVerify} disabled={isSubmitting}>{isSubmitting ? "Verifying…" : "Final verify attendance"}</button> : null}{record.verification.status === "verified" ? <span className="hr-review-note">This record is protected from technical reprocessing.</span> : null}<button type="button" className="button-secondary" onClick={onClose}>Close</button></div></aside></div>;
}

function ReviewSection({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <section className="hr-review-section">
            <h3>{title}</h3>
            {children}
        </section>
    );
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className="hr-review-detail">
            <dt>{label}</dt>
            <dd>{value}</dd>
        </div>
    );
}

function CorrectionDialog({
    record,
    isSubmitting,
    onClose,
    onSubmit,
}: {
    record: HrAttendanceReviewRecord;
    isSubmitting: boolean;
    onClose: () => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
    const defaultIssueType = !record.original.timeIn
        ? "Missing Time-In"
        : !record.original.timeOut
            ? "Missing Time-Out"
            : "Time In and Time Out Correction";

    return <div className="hr-review-modal-layer"><button type="button" className="hr-review-backdrop" onClick={onClose} aria-label="Close correction form" /><form className="hr-review-modal" role="dialog" aria-modal="true" aria-labelledby="hr-correction-dialog-title" onSubmit={onSubmit}><header><div><p className="hr-section-kicker">New correction</p><h2 id="hr-correction-dialog-title">Create attendance correction</h2></div><button type="button" className="hr-review-close" onClick={onClose} aria-label="Close correction form"><Icon name="close" /></button></header><p className="hr-review-modal-copy">The original processed values remain preserved. An approved correction becomes effective but does not final-verify this record.</p><label className="hr-review-modal-field"><span>Correction type</span><select name="issueType" required defaultValue={defaultIssueType}>{issueTypeOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="hr-review-modal-field"><span>Corrected Time-In</span><input name="correctedTimeIn" type="datetime-local" defaultValue={toLocalDateTime(record.effective.timeIn)} /></label><label className="hr-review-modal-field"><span>Corrected Time-Out</span><input name="correctedTimeOut" type="datetime-local" defaultValue={toLocalDateTime(record.effective.timeOut)} /></label><label className="hr-review-modal-field"><span>Reason</span><input name="reason" required maxLength={500} placeholder="Why is this correction needed?" /></label><label className="hr-review-modal-field"><span>Remarks <small>(optional)</small></span><textarea name="remarks" maxLength={1000} rows={4} placeholder="Add supporting context for the HR decision." /></label><footer><button type="button" className="button-secondary" onClick={onClose} disabled={isSubmitting}>Cancel</button><button type="submit" className="button-primary" disabled={isSubmitting}>{isSubmitting ? "Saving…" : "Create correction"}</button></footer></form></div>;
}

function DecisionDialog({ decision, note, isSubmitting, onNoteChange, onClose, onConfirm }: { decision: Decision; note: string; isSubmitting: boolean; onNoteChange: (value: string) => void; onClose: () => void; onConfirm: () => void }) {
    const reject = decision === "reject";
    return <div className="hr-review-modal-layer"><button type="button" className="hr-review-backdrop" onClick={onClose} aria-label="Close correction decision" /><div className="hr-review-modal" role="dialog" aria-modal="true" aria-labelledby="hr-decision-dialog-title"><header><div><p className="hr-section-kicker">Correction decision</p><h2 id="hr-decision-dialog-title">{reject ? "Reject correction" : "Approve correction"}</h2></div><button type="button" className="hr-review-close" onClick={onClose} aria-label="Close correction decision"><Icon name="close" /></button></header><p className="hr-review-modal-copy">{reject ? "A rejection reason is required. The original attendance will remain effective." : "Approval changes the effective attendance values. Final verification remains a separate HR action."}</p><label className="hr-review-modal-field"><span>{reject ? "Rejection reason" : "Decision note"}{reject ? "" : " (optional)"}</span><textarea value={note} onChange={(event) => onNoteChange(event.target.value)} maxLength={1000} rows={4} required={reject} /></label><footer><button type="button" className="button-secondary" onClick={onClose} disabled={isSubmitting}>Cancel</button><button type="button" className={reject ? "button-danger" : "button-primary"} onClick={onConfirm} disabled={isSubmitting || (reject && !note.trim())}>{isSubmitting ? "Saving…" : reject ? "Reject correction" : "Approve correction"}</button></footer></div></div>;
}
