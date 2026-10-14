# EMPLOYEE-NOTIF-001 — Hide Zero Employee Notification Badge

## Status

Completed

## Completed

2026-10-14

## Original Goal

Prevent the Employee page from displaying a `0` notification number when no
notifications are available.

## Implementation Summary

Updated the Employee navbar so the bell badge and profile-menu count render
only when the notification count is greater than zero. The open notification
menu now says `No new notifications` instead of displaying `0 available`.

## Files / Areas Changed

- `src/components/layouts/employee/EmployeeNavbar.tsx`
- `Workflows/STATE.md`

## Important Technical Decisions

- Kept the existing notification count and positive-count display behavior.
- Used conditional rendering rather than CSS-only hiding so zero-count
  elements are absent from the accessible UI.
- No API, backend, routing, or dependency changes were needed.

## Verification

- PASS — `npm.cmd exec -- tsc --noEmit`
- PASS — `npm.cmd run lint` with one pre-existing warning in
  `src/server/repositories/payroll/payslip.repository.ts`
- PASS — `git diff --check`
- NOT RUN — browser interaction and visual verification were not available.

## Known Limitations

The notification list remains the existing static empty list; this task only
corrects the zero-count presentation.

## Follow-Up

Connect the Employee notification list and count to the authoritative
notification source when that feature is implemented.

## Git Reference

`b3112b1` (`fix: hide zero employee notification count`)
