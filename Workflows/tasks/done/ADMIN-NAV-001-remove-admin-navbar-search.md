# ADMIN-NAV-001 — Remove Admin Navbar Search

## Status

Completed

## Completed

2026-10-14

## Original Goal

Remove the unused search input from the Admin navigation/header and clean up
its associated behavior.

## Implementation Summary

Removed the Admin navbar desktop search input, mobile search input, search
trigger, and Ctrl/Cmd+K open-search handler. Removed the associated unused
component props and CSS while preserving the real search filters inside Admin
workspaces.

## Files / Areas Changed

- `src/components/layouts/admin/AdminNavbar.tsx`
- `src/components/layouts/admin/AdminShell.tsx`
- `src/app/styles/layouts/admin-navbar.css`
- `Workflows/STATE.md`

## Important Technical Decisions

- Removed the unused search flow at its source rather than hiding it with CSS.
- Preserved page-level filters used by Audit Logs, User Accounts, and other
  Admin workspaces.
- No route, API, backend, or dependency changes were needed.

## Verification

- PASS — `npm.cmd exec -- tsc --noEmit`
- PASS — `npm.cmd run lint` with one pre-existing warning in
  `src/server/repositories/payroll/payslip.repository.ts`
- PASS — `git diff --check`
- NOT RUN — browser interaction and visual/responsive verification were not
  available.

## Known Limitations

The Admin navbar was not browser-tested at each responsive breakpoint in this
environment.

## Follow-Up

No follow-up is required for the navbar removal. Existing workspace search
filters remain intentionally available.

## Git Reference

`3713abf` (`refactor: remove admin navbar search`)
