# Project State

> Current snapshot for the Next.js frontend. This is project reality, not a
> changelog or a replacement for permanent task records.

## Current Overall Status

- SYSTEM-UI-CLEAN-003 is complete. Production portal wording no longer exposes
  obsolete prototype, demo, sample, mock, or development-only language. Real
  simulated adapter, unavailable, pending, failed, not-configured, and
  read-only states remain explicit. Lint, TypeScript, diff, and production
  build checks passed; browser, visual, responsive, accessibility, and live
  provider checks were not available for this cleanup.

- ADMIN-BACK-004 follow-up hardening now records account role changes as the
  distinct `admin.user.role_changed` event and gives the shared Admin profile
  menu trigger an accessible name. TypeScript, lint, diff, and production build
  checks passed; authenticated browser and live Firestore verification remain
  unavailable, and the local `next start` attempt is blocked by a Windows SWC
  UNC-path canonicalization error.

- Workflow status: Project context and the implemented HTML prototype have been
  migrated into the Next.js target. The Admin shell fixes, Employee
  self-service UI refinement, mobile account/profile flow, Payslips page, HR /
  Attendance Staff dashboard, HR attendance workflow, Attendance Monitoring,
  Correction Requests, Employee Schedules, Employee Directory, Attendance
  Reports, Admin Roles & Permissions, and the four Admin
  integration-page UI repairs, the rebuilt Admin Audit Logs workspace, and the
  Admin System & Settings workspace, the Admin User Accounts management
  workspace, the Employee Announcements workspace, the Employee Help &
  Support inline support-request refinement, the Employee Attendance QR demo
  refinement, the Employee notification/announcement synchronization, and the
  Employee Attendance Calendar navigation, the synchronized temporary
  Employee QR attendance demo, the HrWorkflowContext readonly-history
  type-contract fix, the Employee Payslip monthly/per-cutoff upgrade, and the
  from-scratch HR Audit History rebuild, the Firebase foundation and
  initialization layer, the Firebase development seeder foundation and first
  real development seed, and the
  Accounting Staff portal foundation with its
  dashboard, complete Integration Status migration, and Transaction History
  migration are implemented. The Payroll Staff portal foundation, protected
  Payroll Dashboard migration, protected Verified Attendance migration,
  protected Payroll Batches migration, protected Payroll Handoff migration,
  protected Payroll History migration, and the full-stack Payroll Handoff and
  Payroll Results integrations are also implemented. TASK-047
  through TASK-085, TASK-101, TASK-102, TASK-103, TASK-104, TASK-105, and
  TASK-106, TASK-110, TASK-111, TASK-112, TASK-113, TASK-114, TASK-115,
  ADMIN-BACK-001, ADMIN-BACK-002, and ACC-BACK-001, ACC-BACK-002,
  ACC-BACK-003, ACC-BACK-004, and ADMIN-BACK-003 are complete. ADMIN-BACK-004
  now provides the protected, read-only centralized Audit Logs view over
  normalized real HR, Payroll, Accounting, Admin, and integration audit events.
  TASK-101 through TASK-106 keep the remaining Payroll
  navigation entries
  planned until their individual migrations are requested. The previous HR
  Audit History route was removed in TASK-064 and
  replaced by the new TASK-065 implementation. TASK-074 now replaces runtime
  prototype credential checking with Firebase Auth, an HttpOnly server
  session, Firestore-backed user resolution, and server-side role guards.
  Feature data remains mock/local and is not part of this authentication
  migration. TASK-075 verified all four seeded Auth/Firestore account
  relationships and corrected client handling for session 401/403 responses.
  TASK-076 now resolves the authenticated account through
  `users/{uid}.employeeId` to a validated `employees/{employeeId}` reference,
  exposes that safe context through `/api/v1/me`, and uses it for role shells
  and Employee identity surfaces while feature datasets remain mock/local.
  The Firebase Email/Password provider is currently disabled in the configured
  project, so browser password login remains blocked by Firebase until that
  provider is enabled. The current Next.js production build now passes in this
  environment, while interactive browser verification remains limited by the
  unavailable configured login provider. Firebase health endpoints were
  verified through the local process.
- TASK-084 now extends the TASK-082 permanent employee QR flow into real daily
  attendance persistence. The authorized canonical `/scanner` route sends only
  the raw QR value to the server; the server derives the scanner operator from
  the authenticated session, verifies the QR, resolves the employee, and uses
  an atomic Firestore transaction to record Time In, Time Out, or a controlled
  duplicate/completed result. Attendance documents use the deterministic
  `attendance/{employeeId}_{attendanceDate}` key, authoritative timestamps,
  QR source fields, and Asia/Manila business dates. The server-side
  `QR_ATTENDANCE_SIGNING_SECRET` remains required for QR validation.
- TASK-085 now makes `/employee/my-attendance` read the authenticated Employee's
  current Asia/Manila attendance record through the canonical Attendance
  repository and a protected `GET /api/v1/attendance/me/today` endpoint. The
  page shows real Time In, Time Out, status, and per-event source values;
  missing today's records are shown as a normal empty state and read failures
  are shown separately. The page does not accept a browser-selected Employee
  ID or use client Firestore/localStorage attendance as its authority.
- Next.js application status: The source HTML prototype is implemented as a
  typed App Router application with shared Employee, HR, administrator, and
  Accounting Staff shells.
- Next.js version: `16.3.5`.
- Router: App Router under `src/app/`.
- Package manager: Yarn `4.1.0` through Corepack.
- Source prototype status: `employee-html/` remains unchanged and is still the
  visual and content reference.
  - Active application task: None. ADMIN-BACK-004 records the completed centralized Audit Logs integration. ADMIN-BACK-003 records the completed full-stack Roles & Permissions authorization layer. ACC-BACK-001, ACC-BACK-002, ACC-BACK-003, and ACC-BACK-004 record the completed
  Accounting Approved Payroll real-data bridge. TASK-115 records the completed full-stack
   Payroll History integration. TASK-114 records the completed full-stack
   Payroll Results integration. TASK-113 records the completed full-stack
   Payroll Handoff integration. TASK-112 records the completed real-data
   Payroll Batches integration. TASK-111 records the completed real-data
   Payroll Verified Attendance integration. TASK-110 records the completed real-data
   Payroll Dashboard backend integration. TASK-106 records the completed protected
   Payroll Results migration. TASK-105 records the completed Payroll
   Handoff icon refinement. TASK-104 records the completed protected
   Payroll Handoff migration. TASK-103 records the completed protected Payroll
   Verified Attendance migration. TASK-101 records the completed protected
   Payroll Dashboard migration. TASK4 / Employee Payslip History now reads
  authenticated employee-scoped Payroll System snapshots. TASK3 / scanner success feedback records the
  completed result-state animation and feedback refinement. TASK-085 records the completed real
  Employee My Attendance read flow. TASK-084 records the completed real
  QR attendance Time In / Time Out flow. TASK1 / TASK-082 records the completed
  employee-specific permanent QR verification. TASK-087 records the completed
  canonical scanner-route alignment. TASK-086 records the completed HR scanner
  navigation alignment. Earlier per-employee dashboard development fixtures
  remain mock data. TASK-081 records the completed Employee
  Profile real-data integration. TASK-080 records the completed Employee
  Dashboard real-data integration. TASK-079 records the corrected shared `/scanner` route
  and race-safe camera cleanup. TASK-078 records the completed
  Admin scanner navigation link and shared scanner access. TASK-077 records the
  completed employee QR identity and HR scanner foundation. TASK-076 records the completed authenticated
  user and employee-info integration. TASK-075 records the completed Firebase
  session 401 investigation and client error-mapping correction. TASK-074 records the completed Firebase
  Authentication and server-session migration. TASK-073 records the completed first real
  Firebase development seed. TASK-072 records the completed Firebase
  development seeder foundation. TASK-071 records the completed Firebase
  foundation verification. TASK-070 records the completed Accounting
  Transaction History migration. TASK-069 records an Employee-style Accounting
  shell and page UI update that was implemented and then reverted. TASK-068
  records the completed Accounting
  Integration Status migration. TASK-067 records the completed Accounting
  Staff portal foundation and dashboard migration. TASK-063 records the completed Employee
  Payslip monthly/per-cutoff view and detailed pay breakdown upgrade. TASK-062
  records the completed HrWorkflowContext readonly-history type-contract fix.
  TASK-061 records the completed Employee
  page breadcrumb cleanup. TASK-060 records the completed full-stack
  architecture preparation. TASK-066 records the completed Firebase
  foundation and initialization layer. TASK-059 records the completed role-aware
  authentication login/logout toast flow. TASK-058 records the completed
  synchronized temporary Employee QR attendance demo. TASK-056 records the completed
  Employee Attendance Calendar navigation. TASK-055 records the completed Employee
  notification/announcement synchronization. TASK-054 records the completed
  Employee Help & Support inline support-request refinement. TASK-053 records the completed
  Employee Payslip Details modal. TASK-052 records the completed Employee My
  Attendance monthly calendar. TASK-051 records the completed Employee
  Attendance QR demo refinement. TASK-050 records the completed Employee Help
  & Support workspace. TASK-049 records the completed Employee Announcements
  workspace. TASK-048 records the completed User Accounts
  modal overflow correction. TASK-047 records the completed Admin User
  Accounts overflow correction. TASK-046 records the completed Admin User
  Accounts management workspace. TASK-045 records the completed Admin System
  & Settings workspace. TASK-044 records the completed from-scratch
  replacement of the Admin Audit Logs workspace. TASK-043 records the prior
  Accounting-styled implementation, and TASK-042 records the initial Audit
  Logs implementation. TASK-040 records the completed
  responsive UI repair for Payroll Integration, Accounting Integration,
  Integration Errors, and User Accounts. TASK-006 through TASK-009 remain
  historical records of the initial feature implementations.

- Employee Payslips, Announcements, and Help & Support now keep the Employee
  navbar as the single page-title location; duplicate main titles were removed
  and the navbar title uses standard bold weight.

- TASK-093 / HR Attendance Reports now reads canonical Firestore attendance
  through the shared Attendance Repository and Employee Repository. The page
  supports server-filtered daily, monthly, missing-time-out, source-usage, and
  correction-summary views with real summary values, read-only CSV/print
  output, controlled empty/error states, and no mock attendance fallback.

- TASK-094 / HR Audit History now reads a normalized, read-only activity view
  from persisted Attendance and AttendanceCorrectionRequests metadata. It
  shows persisted Time In/Time Out operator timestamps and correction
  submission/approval/rejection events with server-side filters, pagination,
  and HR-protected CSV export. Invalid QR scans and non-persisted mock
  verification events are not fabricated.

## SYSTEM-RECON-001 Reconciliation Snapshot

The 2026-10-14 repository reconciliation confirms a mixed state: the
authenticated identity chain, QR attendance persistence, Payroll lifecycle,
Accounting projections/transfers, and the newer Admin control-center routes
are server-backed. Payroll and Accounting external boundaries remain explicit
simulated adapters, HRPS is a local Firestore reference boundary, and Bundy is
not configured. The main disconnected core workflow is HR final verification:
the current `HrWorkflowContext` writes only client state while Payroll requires
persisted `attendance.hrVerification.status === "verified"`. Employee
correction submission is also not connected end-to-end.

The reconciliation found no P0 issue. P1 follow-ups are persisted HR final
verification, employee correction submission, and direct permission guards for
HR directory/schedule pages. Remaining P2/P3 findings are recorded in
`Workflows/tasks/done/SYSTEM-RECON-001-full-project-integration-reconciliation.md`.
Authenticated Firebase, live provider, browser, responsive, and accessibility
verification remain unavailable in the current environment.

## Page / Route Status

| Route | Status | Source mapping |
|---|---|---|
| `/` | Implemented | `employee-html/index.html` |
| `/employee/dashboard` | Implemented with authenticated server-derived current-day attendance and recent Firestore attendance records; static payroll and monthly summary fixtures remain separate; authenticated browser verification pending | `employee/dashboard.html`; TASK-058 / TASK2 |
| `/employee/my-attendance` | Implemented with the existing navigable month/year calendar, real authenticated employee attendance dates, and a server-rendered current-day Firestore attendance view; reminders and support cards removed; authenticated browser verification pending | TASK-052 / TASK-056 / TASK-085 / TASK-095 / TASK-096 |
| `/employee/attendance-qr` | Implemented with a server-signed employee-specific QR, centered QR card, and safe refresh/error states; guidance and security notice cards removed; runtime verification pending | TASK-077 / TASK-097 |
| `/employee/attendance-history` | Implemented with authenticated Firestore history, real status/source/date fields, functional month/status/date filters, and client pagination; authenticated browser verification pending | TASK-086; current Employee attendance-history UI |
| `/employee/payslips` | Implemented with authenticated employee-scoped Payroll System snapshot reads, Per Cutoff / Monthly views, safe empty/error states, dynamic local pagination, and a read-only cutoff/monthly details modal; live Firebase/browser verification pending | TASK-053 / TASK-063 / TASK4 |
| `/employee/profile` | Implemented; runtime verification pending | Employee self-service profile route using existing typed profile data |
| `/employee/announcements` | Implemented with shared Navbar/dashboard announcement data and query-linked modal deep links; runtime verification pending | TASK-049 / TASK-055 |
| `/employee/help-support` | Implemented with an inline support-request form; runtime verification pending | TASK-050 / TASK-054 |
| `/admin/dashboard` | Implemented | `admin/dashboard.html` |
| `/admin/integration-monitoring` | Implemented | `admin/integration-monitoring.html` |
| `/admin/hrps-integration` | Implemented | `admin/hrps-integration.html` |
| `/admin/bundy-biometric-etl` | Implemented | `admin/bundy-biometric-etl.html` |
| `/admin/qr-attendance` | Implemented | `admin/qr-attendance.html` |
| `/admin/unified-attendance` | Implemented | `admin/unified-attendance.html` |
| `/admin/payroll-integration` | Rebuilt with the Accounting-flow-based responsive composition; HTTP smoke check recorded as passed | TASK-006 / TASK-040 |
| `/admin/accounting-integration` | Rebuilt with contained flow, cards, tables, and responsive sections; HTTP smoke check recorded as passed | TASK-007 / TASK-040 |
| `/admin/integration-errors` | Rebuilt with contained filters, error details, tables, and responsive sections; HTTP smoke check recorded as passed | TASK-008 / TASK-040 |
| `/admin/user-accounts` | Implemented as a protected full-stack Firebase Auth and Firestore application-account manager with real profile/employee joins, filters, pagination, creation, profile updates, role assignment, employee linkage, enable/disable controls, account details, audit activity, and safety guards; official HRPS fields remain read-only | ADMIN-BACK-002 |
| `/admin/audit-logs` | Rebuilt from scratch with the Accounting Integration page flow, read-only audit content, filters, pagination, internal table scrolling, and an accessible detail drawer | TASK-042 / TASK-043 / TASK-044 |
| `/admin/settings` | Implemented as the application-level System & Settings workspace with safe preferences, local persistence, system information, and responsive internal navigation | TASK-045 |
| `/scanner` | Implemented as the Admin/HR camera/manual QR attendance scanner with a dominant left camera workspace, compact right employee-result panel, race-safe camera cleanup, five-second successful-result auto-reset, distinct Time In / Time Out / completed / duplicate feedback, and a reduced-motion-aware success animation for fresh attendance results | TASK-078 / TASK-079 / TASK-084 / TASK1 / TASK3 |
| `/hr/dashboard` | Implemented with server-derived active Employee count, current-day attendance metrics, real awaiting-Time-Out items, and unavailable states for unsupported HR data; authenticated browser verification pending | TASK-017 / TASK-039 / TASK-087 |
| `/accounting/dashboard` | Implemented as a protected real-data Accounting overview over Payroll Results, Accounting Readiness, Transfers, acknowledgements, and transaction history, with loading/error/empty/refresh states; authenticated runtime/browser verification pending | ACC-BACK-004; `src/server/accounting/accounting-dashboard.service.ts` |
| `/accounting/approved-payroll` | Implemented as a protected Accounting Staff view over persistent Payroll Results and Accounting transfer records with server-derived readiness, real references/counts, server filters/pagination, loading/error/empty states, and truthful transfer/amount states; authenticated runtime/browser verification pending | ACC-BACK-001 / ACC-BACK-002 / `src/server/accounting/accounting-approved-payroll.service.ts` |
| `/accounting/integration-status` | Implemented as a protected full-stack Accounting transfer workflow with Firestore transfer records, server-side readiness revalidation, deterministic adapter outcomes, duplicate/concurrency protection, audit events, real summary/history/attention data, retry handling, details/timeline, loading/error/empty states, and no live Accounting API configured; authenticated runtime/browser verification pending | ACC-BACK-002 / `src/server/accounting/accounting-transfer.service.ts` |
| `/accounting/transaction-history` | Implemented as a protected read-only projection over persistent Accounting Transfers and Payroll Results, with server-derived lifecycle summaries, real filters/pagination, detail APIs, audit timelines, loading/error/empty states, and no duplicate history collection; authenticated runtime/browser verification pending | TASK-070 / ACC-BACK-003; `src/server/accounting/accounting-transaction-history.service.ts` |
| `/payroll/dashboard` | Implemented as a protected Payroll Staff workspace backed by a server-side aggregate over current attendance, correction, and employee repositories; unsupported HR verification, batch, and handoff records show truthful zero/empty states; runtime/browser verification pending | TASK-101 / TASK-110; `Workflows/migration/Payroll-dashboard.html` |
| `/payroll/verified-attendance` | Implemented as a protected Payroll Staff workspace backed by the Payroll Verified Attendance service and API, with server-side employee-period grouping, URL filters/pagination, truthful HR-final-verification and readiness states, and no persisted batch fallback; runtime/browser verification pending | TASK-102 / TASK-111; `Workflows/migration/Payroll-verified-attendance.html` |
| `/payroll/batches` | Implemented as a protected Payroll Staff workspace backed by Firestore `payrollBatches` and membership records, with server-validated Ready-for-Payroll snapshots, Draft removal, lifecycle transitions, immutable submitted records, filters, pagination, real counts, and retryable error/empty states; authenticated runtime/browser verification pending | TASK-103 / TASK-112; `Workflows/migration/payroll-batches.html` |
| `/payroll/handoff` | Implemented as a protected Payroll Staff workspace backed by persistent `payrollHandoffs`, server-revalidated Ready batches, authenticated submit/list/detail APIs, deterministic simulated adapter responses, real transfer/acknowledgement states, filters, pagination, details, timelines, and safe failure states; authenticated runtime/browser verification pending | TASK-104 / TASK-113; `Workflows/migration/payroll-handoff.html` |
| `/payroll/results` | Implemented as a protected Payroll Staff workspace backed by persistent Payroll Result and employee-item records from the Payroll Integration Adapter, with real summary metrics, server filters/pagination, batch results, notices, details, refresh/error states, and Employee Payslip upserts; authenticated runtime/browser verification pending | TASK-106 / TASK-114; `Workflows/migration/Jerzel/payrollresult.html` |
| `/payroll/history` | Implemented as a protected read-only Payroll lifecycle projection over persistent Batches, Handoffs, and Results, with derived lifecycle statuses, real summaries, filters/pagination, details, timelines, issue states, loading/error/empty states, and no separate History collection; authenticated runtime/browser verification pending | TASK-107 / TASK-115; `Workflows/migration/Jerzel/payrollhistory.html` |
| `/hr/attendance-monitoring` | Implemented as a protected, read-only view over canonical Firestore QR attendance records with server-side filters, employee joins, safe DTOs, and pagination; authenticated browser verification pending | TASK-031 / TASK-039 / TASK-088 |
| `/hr/correction-requests` | Implemented with correction-to-verification handoff; runtime verification pending | TASK-032 / TASK-039 |
| `/hr/employee-schedules` | Implemented as a protected, read-only view over Employee-linked Firestore HRPS schedule references; authenticated browser verification pending | TASK-035 / TASK-090 |
| `/hr/employee-directory` | Implemented as a protected, read-only view over Firestore Employee reference records with real name, ID, department, position, employment status, search, and filters; authenticated browser verification pending | TASK-036 / TASK-089 |
| `/hr/attendance-reports` | Implemented with verification/readiness reporting; runtime verification pending | TASK-037 / TASK-039 |
| `/hr/audit-history` | Implemented with server-derived persisted attendance and correction events, server-side filters/pagination, HR-protected CSV export, and inline event details; authenticated browser verification pending | TASK-065 / TASK-094 |
| `/admin/roles-permissions` | Implemented as a protected full-stack role-permission management workspace with a controlled five-role catalog, Firestore-backed assignments, member counts, optimistic updates, dependency/lockout validation, audit events, real server enforcement, and permission-aware navigation; authenticated runtime verification pending | ADMIN-BACK-003 |

The System & Settings entry is available at the implemented `/admin/settings`
route in the administrator navigation. Audit Logs now has the implemented
`/admin/audit-logs` route.

## Implemented Capabilities

- Firebase Authentication now handles username-based login through the shared
  deterministic username-to-Auth identity and short-password compatibility
  adapter. The browser signs in with in-memory Firebase persistence, exchanges
  the ID token at `/api/v1/auth/session`, and the application uses the returned
  HttpOnly `aujsc_session` cookie as its canonical session.
- Server-side Firestore `users/{uid}` records now provide the active account,
  display name, employee link, and canonical role. Admin, HR, Employee, and
  Accounting App Router layouts enforce their own verified role, while the
  Next.js 16 `proxy.ts` only performs a lightweight cookie-presence redirect.
- Shared authentication flash toasts still show one-time role-specific login
  success and logout confirmation messages. Logout now clears the server
  session endpoint and signs out the temporary in-memory Firebase client state;
  no prototype role/username session keys remain.
- Session API failures now map 401 responses to invalid credentials and 403
  responses to unavailable accounts on the login client. Firebase provider
  configuration failures are surfaced as a configuration message instead of
  being mistaken for a transient session failure.
- Full-stack preparation now has a versioned `src/app/api/v1/` boundary with
  an application-only `/api/v1/health` route, browser-safe native-fetch API
  helpers, shared API response types, server scaffolding for services,
  repositories, validators, auth, and external adapters, and explicit
  Firebase client/server boundaries. The official Firebase Web and Admin SDKs
  are installed. Lazy singleton accessors expose client Auth/Firestore and
  server-only Admin Auth/Firestore, and `/api/v1/health/firebase` verifies
  server configuration and Firestore reachability without exposing secrets.
  With local configuration, both health endpoints and a read-only Admin/
  Firestore connectivity probe have passed repeated verification.
  Existing features remain on mock/simulation data; no feature data migration
  has started.
- Firebase development seeder foundation is implemented under `scripts/firebase/`.
  It uses the existing Firebase Admin boundary, supports `employees` and
  `users` seeders with deterministic IDs, dependency-aware execution,
  idempotent merge behavior, offline dry-run mode, and a development/test-only
  write guard. Four development Auth users, four Firestore user documents, and
  four Firestore employee documents now exist in the configured development
  project. The seeded Firebase records are not consumed by the application;
  prototype authentication and mock feature data remain the active runtime.
- The login route now follows the source `employee-html/index.html` structure:
  full-page AU campus background, left branding panel, centered white login
  card, AU logo panel, username/password fields, show-password checkbox,
  Show password checkbox, red Login button, and a spaced secondary-action row
  for Forgot password and Contact IT Support. Remember me is not part of the
  form.
- The source HTML repository contains no register/signup screen, so no
  unverified register route was added to Next.js.
- Shared responsive employee and administrator layouts with separate shell,
  main, sidebar, and navbar components. The Admin navbar now uses fluid flex
  sizing, a medium-width compact search trigger, and narrow-width secondary
  content collapse so it remains usable across Admin routes.
- Administrator route-aware active navigation, mobile sidebar overlay, desktop
  and mobile search, Ctrl/Cmd+K search focus, Escape handling, profile menu,
  notification/help feedback, prototype action feedback, and centered sidebar
  profile-avatar icon alignment.
- Employee mobile navigation, active dashboard context, notification/help/theme
  feedback, and dashboard content with attendance, payroll, and announcements.
- Employee My Attendance main content is implemented with the existing Employee
  shell, route-aware sidebar navigation, server-derived current-day attendance
  data, read-only quick actions, reminders, and help guidance. The page reads
  only the authenticated Employee's linked attendance record and distinguishes
  a real empty day from a failed attendance read.
- Employee My Attendance retains its frontend navigable month/year calendar for
  the existing historical prototype view, while the current day's calendar
  cell now uses the same server-derived Firestore state and Asia/Manila date as
  the real attendance summary.
- Employee Attendance QR main content is implemented with the existing
  Employee shell, route-aware navigation, typed prototype QR data, expiry
  countdown, refresh feedback, attendance status, instructions, and security
  notice. Its question-mark help icon now temporarily simulates deterministic
  Time-In and Time-Out scans through a validated, current-campus-day
  localStorage record shared with the Employee Dashboard and My Attendance;
  the Security Notice shield clears only that demo key. Campus date and
  QR-generation timestamps use Asia/Manila time. The QR preview remains
  intentionally prototype-only and has no backend token or scannable encoder.
- Employee Dashboard retains its existing mock/development attendance fixture
  behavior. My Attendance no longer uses a mock or browser-local attendance
  fallback: missing today's Firestore record shows the approved empty state,
  the schedule remains the existing prototype reference, late/undertime values
  remain neutral because no real policy exists, and a completed QR day maps to
  the calendar's existing Present status vocabulary.
- Employee Attendance History main content is implemented with the existing
  Employee shell, typed mock records, monthly summary cards, filter controls,
  selectable responsive table, record-details panel, pagination controls, and
  prototype export/reset feedback.
- Employee Payslips uses the existing Employee shell with typed, read-only
  payroll data, Per Cutoff / Monthly view switching, current September 2026
  cutoff history, view-aware status filters, dynamic local pagination, and
  contained responsive tables. The September 16–30 cutoff remains In Progress
  without a finalized payslip action, while September 1–15 is the latest
  released cutoff.
- Employee Payslips opens one focused details modal architecture for both
  cutoff payslips and monthly summaries. Cutoff details show monthly basic
  salary, cutoff basic pay, reference daily rate, individual deductions,
  totals, net pay, and the Existing Payroll System boundary note. Monthly
  summaries show released-cutoff coverage and let the employee open included
  released cutoff records. Values remain explicit prototype data; the SIA
  frontend does not calculate payroll, persist payroll, download documents,
  or connect to a backend.
- Employee self-service pages now use grouped attendance details, compact
  action lists, a QR-focused hero layout, restrained summary metrics, and an
  on-demand Attendance History record-details drawer while preserving the
  existing Employee Dashboard as the visual source of truth.
- Employee narrow-screen navigation now hides the date and secondary action
  controls behind a single right-side user icon; its account panel provides
  My Profile, prototype notification/settings feedback, and logout navigation.
- Employee QR, Attendance History, Payslips, and Profile feature pages no
  longer render page-level Dashboard breadcrumbs. Their page content, navbar
  titles, sidebar links, route URLs, and feature interactions remain intact;
  unused breadcrumb CSS was removed and the QR subtitle spacing was reset.
- Employee Profile is a read-only prototype route using the existing typed
  employee attendance profile data; it does not edit HRPS-owned information.
- Employee Announcements is a read-only `/employee/announcements` route using
  the shared dashboard announcement data. It provides category filters, local
  case-insensitive search, newest-first results, announcement details in an
  accessible modal, and the latest three items on the dashboard preview. The
  Employee Navbar derives its latest five notification rows, available-count
  badge, View all link, and stable query deep links from the same data. It has
  no backend, notification persistence, or CRUD behavior.
- Employee Help & Support is a `/employee/help-support` route using the
  Employee visual language. It provides one compact inline support-request
  form with concern-type routing, subject/description validation, attendance
  correction guidance, a local prototype success reference, quick links,
  attendance/QR/correction/history/payslip/account/announcement guidance, and
  a local FAQ accordion. It has no ticketing persistence, chat, chatbot, API,
  storage, or backend behavior.
- HR / Attendance Staff now has an independent shared shell at `/hr/layout.tsx`
  with an off-canvas responsive sidebar, role-specific navbar, planned future
  navigation placeholders, and a dashboard at `/hr/dashboard`.
- Employee QR identity and HR/Admin scanners now use a real server boundary. The
  employee page signs a versioned HMAC QR payload from the authenticated
  `employees/{employeeId}` reference, `/api/v1/attendance/qr` is employee-only,
  and `/api/v1/attendance/qr/resolve` is limited to HR and Admin. The scanner
  service validates the signature, loads the employee record, derives the
  operator from the HttpOnly session, and writes only through the Firebase
  Admin attendance repository. The daily record preserves Employee ID,
  attendance date, QR source per action, authoritative timestamps, and safe
  scanner-operator snapshots without exposing operator details to the scanner
  response.
- Accounting Staff now has an independent shared shell at `/accounting/layout.tsx`
  with an off-canvas responsive sidebar, role-specific navbar, planned future
  navigation placeholders, and a protected real-data dashboard at
  `/accounting/dashboard`. The dashboard aggregates approved Payroll Results,
  transfer readiness, persisted acknowledgements, integration issues, a
  contextual flow, recent Accounting activity, and accessible read-only batch
  detail dialogs. It does not calculate payroll or write to an Accounting
  system.
- Accounting Integration Status is now a separate `/accounting/integration-status`
  route using the same Accounting Staff shell. It migrates the legacy status
  metrics, six-step flow, connection status, attention-needed transfers, and
  synchronization history into typed React components with responsive internal
  table scrolling. Retry and error controls provide local feedback only.
- Accounting Transaction History is now a separate protected
  `/accounting/transaction-history` route using the same Accounting Staff
  shell and existing dashboard UI primitives. It reads real Accounting
  Transfer records joined to Payroll Result snapshots, derives lifecycle and
  summary state server-side, supports authenticated filters/pagination and a
  read-only detail/timeline API, and preserves empty/error/loading behavior.
  It does not implement journal entries, ledger data, payroll calculation, or
  a duplicate Accounting history collection.
- The HR dashboard includes typed attendance summary metrics, a semantic
  Today's Attendance table, a Pending HR Actions queue, and Recent Attendance
  Issues. TASK-087 now supplies the dashboard's active Employee count and
  current-day attendance summary from server-side Firebase reads; correction,
  verification, schedule, lateness, absence, and overtime values remain
  unavailable rather than using dashboard fixture numbers.
- HR Attendance Monitoring now has a table-first `/hr/attendance-monitoring`
  workspace inside the shared HR shell, with server-derived compact metrics,
  URL-driven date/employee/department/status/source filters, server-side
  pagination, source/status badges, internal table scrolling, a read-only
  record-details drawer, and refresh behavior. It reads the canonical
  Firestore `attendance` collection and joins display data from the Employee
  repository without adding mutations or a second attendance source.
- HR Correction Requests now has a table-first `/hr/correction-requests`
  review queue inside the shared HR shell, with derived request metrics,
  employee/request/status/issue/department/date filters, a current-versus-
  requested correction drawer, evidence and history sections, and real
  server-backed approve/reject decisions. The protected HR API derives the
  reviewer from the authenticated session and applies approved requested time
  fields through a Firestore transaction with pending-state and stale-data
  conflict checks. Original attendance, resulting attendance, reviewer,
  review note, and decision history remain persisted; rejected requests leave
  attendance unchanged.
- HR Employee Schedules now has a protected, read-only `/hr/employee-schedules`
  workspace backed by the canonical Employee repository plus the Employee-linked
  Firestore `employeeSchedules/{employeeId}` HRPS reference collection. It
  preserves the schedule table, search, department/schedule/location filters,
  derived reference metrics, weekly schedule drawer, missing-reference state,
  and distinct query-error state. It does not add schedule CRUD, leave or
  holiday authority, attendance-policy logic, or client-side Firestore access.
- HR Employee Directory now has a protected, read-only
  `/hr/employee-directory` reference workspace backed by the canonical
  Firestore Employee repository. It displays real Employee name, ID,
  department, position, and employment status values with compact metrics,
  search, department/position/employment-status filters, a semantic table,
  explicit empty/error states, and an accessible read-only details drawer. It
  does not add Employee CRUD, user-account management, schedule ownership, or
  sensitive personal data.
- HR Attendance Reports now has a read-only `/hr/attendance-reports` reporting
  workspace with Daily, Monthly, Late, Undertime, Missing Time-Out, Source
  Usage, and Correction Summary modes. It derives filtered records, employee
  aggregates, correction status, source percentages, and summary metrics from
  the existing HR attendance and correction data. It includes relevant filters,
  internal table overflow, CSS-only source bars, CSV export, print behavior,
  and no approval, payroll, discipline, or backend behavior.
- HR Audit History was rebuilt from scratch as a read-only
  `/hr/audit-history` attendance-workflow workspace. It follows the HR
  Dashboard flow with summary cards, review filters, a contained activity
  table, event-area coverage, and inline selected-event details. It uses the
  existing shared HR audit-event data without adding persistence, audit
  editing, payroll information, credentials, or backend behavior.
- HR attendance now has a shared Employee → HR review/correction → HR Final
  Verification → Verified Attendance → Ready for Payroll workflow across the
  dashboard, monitoring, correction requests, and reports.
  Attendance, validation, correction, HR verification, and payroll readiness
  remain separate statuses; correction approval never implies verification or
  payroll readiness. No Supervisor role, dashboard, or approval dependency was
  added.
- Attendance Monitoring no longer presents unsupported validation, HR
  verification, payroll-readiness, absence, late, or Bundy fields as if they
  were authoritative. The page exposes only the canonical QR attendance
  status, source, time, and employee fields available from Firebase.
- Correction Requests now updates the shared workflow state and explicitly
  returns approved corrections to final HR verification.
- Attendance Reports now consumes shared workflow state and includes HR
  Verification / Payroll Readiness summaries, table fields, and CSV fields.
- Admin Roles & Permissions now has an App Router route using the existing
  Admin shell, calculated role/user/permission summaries, active IT
  Administrator and Employee role definitions, grouped permission review, and
  frontend-only edit/save/cancel behavior with protected primary-admin access.
- Admin Audit Logs now has an application-wide read-only `/admin/audit-logs`
  workspace built from a new `src/components/admin/audit-logs/` feature tree
  and `audit-logs.css` stylesheet. It follows the Accounting Integration page
  flow with traceability metrics, an action-to-context flow, ownership and
  coverage sections, search/date/actor/role/module/action/outcome filters,
  newest-first pagination, internal table scrolling, and an accessible event
  detail drawer with recorded changes and related activity. System-generated
  records are labeled as System Process; no audit mutation or backend
  persistence was added.
- Admin System & Settings now has an application-level `/admin/settings`
  workspace using the shared Admin shell and Accounting-style flow composition.
  It provides General, Interface, Attendance, Integration, Audit & Logs, and
  System Information sections with controlled draft/save/discard behavior,
  safe browser persistence, Audit Logs page-size/outcome preferences, and no
  external credentials, endpoint editing, destructive controls, or business
  policy configuration.
- Mock integration health, synchronization, HRPS, Bundy, QR, and unified
  attendance data kept in `src/data/`.
- Payroll Integration now uses a new Dashboard-flow monitoring page with
  summary metrics, health/readiness panels, verified-attendance flow, a
  payroll-ready review table, issue queue, transfer activity, and explicit
  downstream ownership. Its data remains deterministic and frontend-only.
- Accounting Integration monitoring page with approved-Payroll readiness,
  field mapping, transfer batches, blocked/failed transfer, health, history,
  audit visibility, and downstream boundary views.
- Integration Errors monitoring page with deterministic records for HRPS, Bundy /
  Biometric, QR Attendance, Unified Attendance, Payroll Integration, and
  Accounting Integration; source overview, filters, details, timeline,
  retry/acknowledgement simulation, resolution history, and privacy boundary.
- Admin User Accounts now has a focused `/admin/user-accounts` management
  workspace using the existing Admin shell and deterministic account/HRPS
  data. It provides application-account metrics, search and role/status
  filters, a contained horizontally scrollable table, accessible row action
  menus, User Details, Create User, Edit Account, Change Role, Enable/Disable,
  and Delete confirmation modals. Modal and form boundaries use shrinkable
  layout rules, and action menus remain contained within the account workspace.
  HRPS employee fields remain read-only, the primary administrator delete
  action is protected, and all account actions remain local presentation state
  without API, persistence, password, or backend behavior. The modal surface
  renders through a body portal with viewport-constrained sizing so it does not
  participate in the Admin page grid at compact widths; the workspace header
  also wraps before its action can widen the sidebar-constrained content area.
- Filterable mock tables and reusable summary cards, status badges, section
  cards, action buttons, flow diagrams, and progress lists.
- All rendered UI icons now use the shared `Icon` component backed by
  Font Awesome solid icons; raw text-glyph icons were removed from page UI.
- AU image assets copied to `public/images/` without changing the HTML source.
- All application CSS is under `src/app/styles/`, including global tokens,
  layout styles, shared component styles, login styles, employee dashboard
  styles, employee profile styles, HR layout/dashboard styles, and one
  stylesheet for each administrator page, including Roles & Permissions and
  the HR Correction Requests, Employee Schedules, Employee Directory,
  Attendance Reports, HR Audit History, Employee Announcements, Employee Help &
  Support, and Audit Logs workspaces.

## Architecture / Boundaries

- Route files under `src/app/` stay thin and render feature components from
  `src/components/`.
- Client boundaries are limited to interaction-bearing login, HR shell/provider,
  shell/sidebar/navbar, action, filter, and feature explorer components.
- Font Awesome packages are installed for the shared icon layer:
  `@fortawesome/fontawesome-svg-core`, `@fortawesome/free-solid-svg-icons`,
  and `@fortawesome/react-fontawesome`.
- Most migrated feature pages still retain deterministic frontend mock data and
  no external write behavior. The safe application-level `/api/v1/health`
  route and Firebase `/api/v1/health/firebase` route remain available; TASK-084
  adds the scoped QR attendance write path and TASK-085 adds the authenticated
  Employee current-day read path while leaving broader HR/history datasets on
  mock data. Affected HR surfaces do not show prototype/demo banners.
- The backend boundary is documented in the root README and separated as UI →
  API Route Handler → server service → repository → Firebase. `.env.example`
  contains placeholder-only browser and server contracts, while real
  environment files and service-account files remain ignored. Client
  initialization lives under `src/lib/firebase/client/`; server-only Admin
  initialization lives under `src/lib/firebase/server/` and normalizes escaped
  private-key newlines.
- The HR shell owns `HrWorkflowProvider`, which keeps attendance workflow,
  correction decisions, readiness, and audit events consistent across HR
  routes for the current session.
- HRPS remains the authoritative employee-data source in the documented UI;
  Bundy remains an existing attendance source; QR is an additional source;
  Unified Attendance is the standardized internal layer and does not calculate
  payroll.
- The QR signing secret is server-only and separate from Firebase credentials.
  `.env.example` documents `QR_ATTENDANCE_SIGNING_SECRET`; the real local value
  remains ignored and is not stored in source or workflow records.
- Employee My Attendance uses the server-rendered page boundary plus the
  protected `/api/v1/attendance/me/today` Route Handler. Both call the same
  attendance service/repository and derive the Employee ID from the verified
  session; no client Firestore read or browser-selected Employee ID is used.

## Verification

- TASK-077 checks: `corepack yarn lint`, `corepack yarn tsc --noEmit`, and
  `git diff --cached --check` passed. The QR token utility produced distinct
  values for seeded employees `AU-EMP-2026-001` and `AU-EMP-2026-014`, rejected
  tampered/random values, and the service resolved both seeded employees from
  Firebase without writes. Unknown employee resolution was handled as a
  controlled unavailable result. Live API checks returned the expected
  unauthenticated 401 responses; authenticated role checks allowed HR to reach
  the resolver, denied Employee/Admin with 403, returned invalid QR as 422,
  and denied non-Employee accounts from QR generation. The Employee QR 503 in
  the live matrix was expected because this local environment has no
  `QR_ATTENDANCE_SIGNING_SECRET` configured. QR image generation also produced
  a PNG data URL. No browser camera or responsive visual check was run.
- TASK-077 `corepack yarn build`: Blocked before compilation because this
  Android/ARM64 environment lacks the Next.js SWC binary
  (`@next/swc-android-arm64`).

- `corepack yarn lint`: Passed for the from-scratch Admin Audit Logs
  implementation.
- `./node_modules/.bin/tsc --noEmit --pretty false`: Not passed because the existing
  `src/components/layouts/hr/HrWorkflowContext.tsx:143` readonly-history type
  mismatch remains. No new type error was emitted for the Audit Logs files.
- `git diff --check`: Passed.
- Admin Audit Logs source/reference review: Passed. The new route imports only
  the new `audit-logs` feature tree, the old `audit-logs-accounting` tree is
  not referenced, and the audit data source is preserved.
- Admin Audit Logs layout review: Passed. The Admin shell retains width
  ownership, table scrolling is scoped to the table wrapper, and drawer/filter
  grids use shrinkable `minmax(0, ...)` rules.
- Admin System & Settings source review: Passed. The route is thin, the
  sidebar uses the canonical `/admin/settings` route, the page uses the shared
  Admin width model, settings styles are scoped, and no sensitive values or
  external-system controls are present.
- Admin System & Settings verification: `corepack yarn lint` and
  `git diff --check` passed. Browser visual, responsive, keyboard, and route
  smoke checks were not run because the local Next.js runtime is blocked by
  the unavailable Android/ARM64 SWC binary.
- `corepack yarn build`: Blocked before compilation because the Android/ARM64
  Next.js SWC binary is unavailable (`@next/swc-android-arm64`).
- Browser visual, responsive, keyboard, accessibility, and route smoke checks:
  Not run because a browser runtime is unavailable in this environment.
- HR Attendance Monitoring implementation checks: `npm run lint`,
  `npm run build`, and `git diff --check` passed. Lint reports one pre-existing
  warning in `src/server/repositories/payroll/payslip.repository.ts`.
  Browser visual, authenticated runtime, responsive, keyboard, accessibility,
  and route smoke checks were not run in this environment.
- HR Correction Requests implementation checks: `corepack yarn lint`,
  `./node_modules/.bin/tsc --noEmit`, and `git diff --check` passed. Targeted
  source scans found no prohibited prototype/live-integration copy or backend
  integration in the feature. `corepack yarn build` was blocked before
  compilation because the Android/ARM64 Next.js SWC binary is unavailable
  (`@next/swc-android-arm64`); browser visual, responsive, keyboard,
  accessibility, and route smoke checks were not run for the same limitation.
- Correction Requests stylesheet resolution check: passed. The
  `globals.css` import resolves to the tracked
  `src/app/styles/pages/hr/correction-requests.css` file; the reported CSS
  resolution error no longer reproduces from the current source. The earlier
  trace came from a long-running dev process with a stale failed module graph;
  after stopping it and clearing `.next`, a fresh dev start stops earlier on
  the unavailable Android/ARM64 Next.js SWC binary.
- The Employee Payslips typography and summary-strip CSS change passed source
  review; browser visual and responsive verification remains pending.
- The current `corepack yarn build` attempt is blocked before compilation
  because the Android/ARM64 Next.js SWC binary is unavailable
  (`@next/swc-android-arm64`).
- Source protection check: `employee-html/` Git status is clean.
- Earlier administrator route build and smoke checks passed before the current
  Termux session lost access to a compatible Android/ARM64 SWC binary.
- Local `corepack yarn start` smoke check: Passed; `/admin/payroll-integration`
  returned HTTP 200 and rendered the expected route content.
- Local `corepack yarn start` smoke check: Passed;
  `/admin/accounting-integration` returned HTTP 200 and rendered the expected
  route content.
- Local `corepack yarn start` smoke check: Passed;
  `/admin/integration-errors` returned HTTP 200 and rendered the expected route
  content.
- Local `corepack yarn start` smoke check: Passed;
  `/admin/user-accounts` returned HTTP 200 and rendered the expected route
  content; prototype login password values were absent from the response.
- `git diff --check`: Passed for the Task4 application diff.
- `corepack yarn lint`: Passed for the Admin width fix.
- `./node_modules/.bin/tsc --noEmit`: Passed for the Admin width fix.
- `git diff --check`: Passed for the Admin width fix.
- Local development HTTP smoke check: Passed; Payroll Integration,
  Accounting Integration, Integration Errors, and User Accounts returned HTTP
  200 and the generated stylesheet contains the fluid page-root rule.
- Local development HTTP smoke check: Passed; Payroll Integration, Accounting
  Integration, Integration Errors, User Accounts, and Unified Attendance
  returned HTTP 200 after the shared navbar responsive fix.
- `git diff --check`: Passed after the shared navbar responsive fix.
- `corepack yarn lint`: Passed after the shared navbar responsive fix.
- `./node_modules/.bin/tsc --noEmit`: Passed after the shared navbar responsive
  fix.
- `corepack yarn next build --webpack`: Blocked before compilation because the
  local Termux environment attempted to download the Android/wasm SWC package
  and its registry lookup invoked an unavailable Yarn configuration command.
- `corepack yarn lint`: Passed for the Employee My Attendance migration.
- `./node_modules/.bin/tsc --noEmit`: Passed for the Employee My Attendance
  migration.
- `git diff --check`: Passed for the tracked Employee My Attendance changes.
- `corepack yarn lint`: Passed for the Employee Attendance QR migration.
- `./node_modules/.bin/tsc --noEmit`: Passed for the Employee Attendance QR
  migration.
- `git diff --check`: Passed for the Employee Attendance QR migration.
- `corepack yarn lint`: Passed for the Employee Attendance History migration.
- `./node_modules/.bin/tsc --noEmit`: Passed for the Employee Attendance
  History migration.
- `git diff --check`: Passed for the Employee Attendance History migration.
- Local Next.js dev and webpack build checks: Blocked before serving or
  compiling because the local Android/ARM64 SWC binary is unavailable.
- Firefox WebDriver BiDi geometry matrix: Passed for all ten Admin routes at
  390px, 430px, 768px, 1024px, 1280px, 1366px, 1440px, 1920px, 2560px, and
  3440px; document overflow stayed at zero, page content capped at 1600px and
  centered on ultra-wide screens, and the navbar remained full-width with the
  Admin main region.
- Admin sidebar avatar CSS cascade inspection: Passed; the scoped avatar rule
  restores grid centering after the sidebar account span rule changes it to
  flex.
- Employee self-service refinement checks: `corepack yarn lint`,
  `./node_modules/.bin/tsc --noEmit`, and `git diff --check` passed. The
  webpack build remains blocked before compilation by the missing Android/ARM64
  SWC binary, so browser visual and responsive checks were not run.
- Employee mobile account/profile checks: `corepack yarn lint`,
  `./node_modules/.bin/tsc --noEmit`, and `git diff --check` passed. The
  webpack build remains blocked before compilation by the missing Android/ARM64
  SWC binary, so browser menu, route, accessibility, visual, and responsive
  checks were not run.
- Employee Payslips migration checks: `corepack yarn lint`,
  `./node_modules/.bin/tsc --noEmit`, and `git diff --check` passed. The
  production build was attempted and remains blocked before compilation
  because the Android/ARM64 Next.js SWC binary is unavailable. Browser visual,
  responsive-width, keyboard, accessibility, route smoke, and console checks
  were not run for the same limitation.
- Employee Payslips UI refinement checks: the payroll notice was removed and
  summary cards now use equal-height 4/2/1-column responsive layouts. Lint,
  TypeScript, `git diff --check`, and removed-copy checks passed. The
  production build remains blocked before compilation by the missing
  Android/ARM64 SWC binary; browser visual and responsive checks were not run.
- Employee Payslips filter-row fix: Year, Status, Reset, and Apply Filters now
  share one row at tablet and desktop widths, with a stacked mobile fallback.
  Lint, TypeScript, and `git diff --check` passed; browser visual checks remain
  pending because the Android/ARM64 SWC binary is unavailable.
- Admin tablet navigation fix: the Admin sidebar and normal shell remain visible
  through tablet widths, while the hamburger trigger and off-canvas sidebar now
  begin only at the 700px mobile breakpoint. Lint, TypeScript, and
  `git diff --check` passed; browser visual checks remain pending because the
  Android/ARM64 SWC binary is unavailable.
- Admin notice cleanup: removed the duplicate prototype notices from the Admin
  Dashboard, Integration Monitoring, and HRPS Integration pages while keeping
  the shared notice styles for other pages that still use them. Lint,
  TypeScript, targeted copy search, and `git diff --check` passed; browser and
  build verification remain limited by the missing Android/ARM64 SWC binary.
- Admin notice cleanup follow-up: removed the matching top-level prototype
  notices from Integration Errors, User Accounts, and Roles & Permissions.
  Distinct access-boundary and Integration Errors privacy/security content was
  preserved. Lint, TypeScript, targeted copy search, and `git diff --check`
  passed; browser and build verification remain limited by the missing
  Android/ARM64 SWC binary.
- Admin notice cleanup: removed the top-level notice banners from Bundy /
  Biometric ETL, QR Attendance, Unified Attendance, Accounting Integration,
  and Payroll Integration. Table notes, status badges, flow labels, and
  integration-boundary content were preserved. Lint and `git diff --check`
  passed; TypeScript and browser/runtime verification remain limited by the
  existing HR type mismatch and unavailable Android/ARM64 SWC binary.
- HR Employee Schedules implementation checks: `corepack yarn lint`,
  `./node_modules/.bin/tsc --noEmit`, and staged `git diff --check` passed.
  The production build was attempted and remains blocked before compilation
  because the Android/ARM64 Next.js SWC binary is unavailable. Browser visual,
  responsive, keyboard, accessibility, and route smoke checks were not run
  because the runtime could not start.
- HR Employee Directory implementation checks: `npm run lint`,
  `npm run build`, targeted boundary scans, and `git diff --check` passed.
  Lint reports one pre-existing warning in
  `src/server/repositories/payroll/payslip.repository.ts`. Browser visual,
  authenticated runtime, responsive, keyboard, accessibility, and route smoke
  checks were not run in this environment.
- HR Attendance Reports implementation checks: `corepack yarn lint`,
  `./node_modules/.bin/tsc --noEmit`, and staged `git diff --check` passed.
  The production build was attempted and remains blocked before compilation
  because the Android/ARM64 Next.js SWC binary is unavailable. Browser visual,
  responsive, keyboard, accessibility, and route smoke checks were not run
  because the runtime could not start.
- HR Audit History rebuild checks: `corepack yarn lint`,
  `corepack yarn exec tsc --noEmit`, `git diff --check`, and a targeted source
  reference scan passed. The production build reached Next.js but remains
  blocked before compilation because the Android/ARM64 SWC binary is
  unavailable. Browser visual, responsive, keyboard, accessibility, and
  route smoke checks were not run because the runtime could not start.
- HR Verification and Payroll Readiness implementation checks:
  `corepack yarn lint`, `corepack yarn exec tsc --noEmit`, and `git diff
  --check` passed. Targeted source scans confirmed that correction approval is
  separate from HR verification/payroll readiness and that no Supervisor role
  or Pending Approval copy remains in the affected HR surfaces. The production
  build was blocked before compilation because the Android/ARM64 Next.js SWC
  binary is unavailable; browser visual, responsive, keyboard, accessibility,
  and route smoke checks were not run.

## Verification Addendum

- TASK-062 TypeScript build-failure fix checks: `./node_modules/.bin/tsc
  --noEmit --pretty false`, `corepack yarn lint`, and `git diff --check`
  passed. The previous `HrWorkflowContext.tsx:143` readonly-history
  diagnostic is gone. `corepack yarn build` was attempted but remains blocked
  before compilation because the Termux Android/ARM64 environment does not
  have the Next.js SWC binary (`@next/swc-android-arm64`).

- Employee Announcements implementation checks: `corepack yarn lint` and
  `git diff --check` passed. TypeScript still reports the pre-existing
  readonly-history mismatch in `src/components/layouts/hr/HrWorkflowContext.tsx:143`;
  no announcement-file type error was emitted.
- Employee notification/announcement synchronization checks: `corepack yarn
  lint` and `git diff --check` passed. TypeScript still reports the
  pre-existing readonly-history mismatch in
  `src/components/layouts/hr/HrWorkflowContext.tsx:143`; no Task2-specific
  type error was emitted.
- Employee notification/announcement synchronization production build: blocked
  before compilation because the Android/ARM64 Next.js SWC binary is
  unavailable (`@next/swc-android-arm64`). Browser visual, responsive,
  keyboard, accessibility, and route smoke checks were not run because the
  runtime could not start.
- Employee Announcements production build: blocked before compilation because
  the Android/ARM64 Next.js SWC binary is unavailable
  (`@next/swc-android-arm64`). Browser visual, responsive, keyboard,
  accessibility, and route smoke checks were not run because the runtime could
  not start.
- Employee Help & Support support-request implementation checks:
  `corepack yarn lint` and `git diff --check` passed. TypeScript still reports
  the pre-existing readonly-history mismatch in
  `src/components/layouts/hr/HrWorkflowContext.tsx:143`; no Help & Support
  type error was emitted.
- Employee Help & Support production build: blocked before compilation because
  the Android/ARM64 Next.js SWC binary is unavailable
  (`@next/swc-android-arm64`). Browser visual, responsive, keyboard,
  accessibility, and route smoke checks were not run because the runtime could
  not start.
- Employee Attendance QR demo refinement checks: `corepack yarn lint` and
  `git diff --check` passed. TypeScript still reports the pre-existing
  readonly-history mismatch in `src/components/layouts/hr/HrWorkflowContext.tsx:143`;
  no QR/date-related type error was emitted.
- Employee Attendance QR demo production build: blocked before compilation
  because the Android/ARM64 Next.js SWC binary is unavailable
  (`@next/swc-android-arm64`). Browser visual, responsive, keyboard,
  accessibility, and route smoke checks were not run because the runtime could
  not start.
- Employee My Attendance monthly calendar checks: `corepack yarn lint` and
  `git diff --check` passed. TypeScript still reports the pre-existing
  readonly-history mismatch in `src/components/layouts/hr/HrWorkflowContext.tsx:143`;
  no calendar-related type error was emitted. The production build is blocked
  before compilation because the Android/ARM64 Next.js SWC binary is
  unavailable (`@next/swc-android-arm64`). Browser visual, responsive,
  keyboard, accessibility, and route smoke checks were not run because the
  runtime could not start.
- Employee Attendance Calendar navigation checks: `corepack yarn lint` and
  `git diff --check` passed. TypeScript still reports the pre-existing
  readonly-history mismatch in `src/components/layouts/hr/HrWorkflowContext.tsx:143`;
  no TASK3-specific type error was emitted. The production build is blocked
  before compilation because the Android/ARM64 Next.js SWC binary is
  unavailable (`@next/swc-android-arm64`). Browser visual, responsive,
  keyboard, accessibility, and manual month/year interaction checks were not
  run because the runtime could not start.
- Employee Payslip Details modal checks: `corepack yarn lint` and
  `git diff --check` passed. TypeScript still reports the pre-existing
  readonly-history mismatch in `src/components/layouts/hr/HrWorkflowContext.tsx:143`;
  no payslip-modal type error was emitted. The production build is blocked
  before compilation because the Android/ARM64 Next.js SWC binary is
  unavailable (`@next/swc-android-arm64`). Browser visual, responsive,
  keyboard, accessibility, and route smoke checks were not run because the
  runtime could not start.
- Employee QR attendance synchronization checks: `corepack yarn lint`,
  `git diff --check`, and the staged source review passed. TypeScript still
  reports the pre-existing readonly-history mismatch in
  `src/components/layouts/hr/HrWorkflowContext.tsx:143`; no TASK5-specific
  type error was emitted. The production build is blocked before compilation
  because the Android/ARM64 Next.js SWC binary is unavailable
  (`@next/swc-android-arm64`). Browser visual, responsive, keyboard,
  accessibility, storage-persistence, cross-tab, and route smoke checks were
  not run because the runtime could not start.

- TASK6 authentication toast checks: `corepack yarn lint` and `git diff --check`
  passed. Source review confirmed the three implemented roles (admin,
  employee, and HR), one-time `authFlashToast` session-storage consumption,
  role-specific login descriptions, all six logout-bearing layout components
  (seven logout links total), and targeted removal of only `prototypeRole` and
  `prototypeUsername`. TypeScript
  still reports the pre-existing readonly-history mismatch in
  `src/components/layouts/hr/HrWorkflowContext.tsx:143`; no TASK6-specific
  type error was emitted. The production build is blocked before compilation
  because the Android/ARM64 Next.js SWC binary is unavailable
  (`@next/swc-android-arm64`).
- TASK7 full-stack architecture preparation checks: `corepack yarn lint` and
  staged `git diff --check` passed. The `.env.example` ignore check passed,
  Firebase dependency/source scans found no installed Firebase package,
  credential, service-account JSON, or initialization module, and source
  review confirmed that no current route, UI component, CSS, mock data, or
  temporary demo was moved. TypeScript still reports the pre-existing
  readonly-history mismatch in
  `src/components/layouts/hr/HrWorkflowContext.tsx:143`; no TASK7-specific
  type error was emitted. The production build is blocked before compilation
  because the Android/ARM64 Next.js SWC binary is unavailable
  (`@next/swc-android-arm64`). Runtime/API and browser checks were not run
  because the Next.js runtime could not start.
- TASK8 Employee breadcrumb cleanup checks: `corepack yarn lint` and
  `git diff --check` passed. A targeted source scan confirmed that the four
  actual Employee feature components and styles no longer contain breadcrumb
  markup or breadcrumb rules, while sidebar and navbar navigation labels
  remain. TypeScript still reports the pre-existing readonly-history mismatch
  in `src/components/layouts/hr/HrWorkflowContext.tsx:143`; no TASK8-specific
  type error was emitted. The production build is blocked before compilation
  because the Android/ARM64 Next.js SWC binary is unavailable
  (`@next/swc-android-arm64`). Browser and route checks were not run because
  the Next.js runtime could not start.

## Known Limitations

- Browser visual inspection, keyboard/focus interaction, accessibility checks,
  and console verification remain pending; the available browser runtime was
  used for the responsive geometry matrix above.
- Authentication toast timing and one-time flash consumption remain browser-UI
  unverified. The running development server verified the session API, role
  redirects, HttpOnly cookie flags, and browser-equivalent cookie removal.
- The Employee My Attendance route has not yet received authenticated browser
  visual, responsive-width, keyboard, or console verification because the
  configured Firebase Auth provider is disabled for the local login flow.
  Production build and unauthenticated runtime checks passed.
- The Employee Attendance QR route has not yet received browser runtime or
  responsive-width verification for the same SWC limitation. Its QR preview
  is a visual prototype matrix and must be replaced with a backend-signed,
  scannable encoder before real attendance use.
- The Employee Attendance History route has not yet received browser runtime
  or responsive-width verification for the same SWC limitation. Its filters,
  export, pagination, and record data are frontend-only prototype behavior.
- The refined Employee Attendance QR and Attendance History pages have not yet
  received browser visual, responsive, keyboard, or console verification
  because the authenticated browser flow remains unavailable. Employee My
  Attendance has the same authenticated verification limitation after its
  current-day Firebase read integration.
- The Employee mobile account menu and Profile route have not yet received
  browser visual, responsive, or keyboard verification. Notifications and
  settings remain prototype feedback; logout now uses the shared authenticated
  session DELETE flow.
- The Employee Payslips route uses deterministic frontend mock payroll records;
  its view switch, filtering, local pagination, cutoff/monthly summaries, and
  View Payslip actions have no payroll document API, calculation engine, or
  production financial processing. Browser verification remains pending for
  the same SWC limitation.
- HR / Attendance Staff implementation checks: `corepack yarn lint`,
  `./node_modules/.bin/tsc --noEmit`, and `git diff --check` passed. The
  production build was attempted and remains blocked before compilation
  because the Android/ARM64 Next.js SWC binary is unavailable.
- The HR / Attendance Staff shell and dashboard have not yet received browser
  visual, responsive, keyboard, accessibility, or route smoke verification for
  the same SWC limitation. Planned navigation, refresh, notifications, help,
  settings, and logout remain frontend prototype behavior.
- HR Attendance Monitoring has not yet received authenticated browser visual,
  responsive, keyboard, accessibility, or route smoke verification. Its
  filters, metrics, pagination, and details drawer now read real server-side
  Firebase data, but live records and role-authenticated interaction remain
  unverified here.
- HR Correction Requests has not yet received browser visual, responsive,
  keyboard, accessibility, authenticated route, or live Firebase verification
  because browser/authenticated runtime access is unavailable here. The page,
  HR-only decision API, transaction safeguards, correction metadata, and
  development correction seed are implemented and covered by source review,
  TypeScript, lint, production build, and diff checks.
- HR Employee Schedules has not yet received authenticated browser visual,
  responsive, keyboard, accessibility, or route smoke verification. Its page
  now reads Employee identities and Employee-linked HRPS schedule references on
  the server, while live Firebase records, authenticated role access, and the
  development seed write remain unverified here.
- HR Employee Directory has not yet received authenticated browser visual,
  responsive, keyboard, accessibility, or route smoke verification. Its
  filters and read-only drawer now operate on server-loaded Firestore Employee
  records, while live records and role-authenticated interaction remain
  unverified here.
- HR Attendance Reports has not yet received browser visual, responsive,
  keyboard, accessibility, or route smoke verification for the same SWC
  limitation; its filters, derived metrics, report tables, source breakdown,
  CSV export, and print behavior remain frontend-only.
- HR Audit History has not yet received browser visual, responsive, keyboard,
  accessibility, or route smoke verification for the same SWC limitation; its
  new filters, derived summaries, activity table, area coverage, and inline
  event details remain frontend-only.
- HR Verification and Payroll Readiness have not yet received browser visual,
  responsive, keyboard, accessibility, or route smoke verification for the
  same SWC limitation. The shared workflow state, verification action, and
  audit event behavior remain frontend-only and session-local.
- Admin Roles & Permissions implementation checks: `corepack yarn lint`,
  `./node_modules/.bin/tsc --noEmit`, and `git diff --check` passed. The
  production build was attempted and remains blocked before compilation
  because the Android/ARM64 Next.js SWC binary is unavailable.
- Admin Roles & Permissions has not yet received browser visual, responsive,
  keyboard, accessibility, or route smoke verification for the same SWC
  limitation. Permission edits remain frontend-only prototype behavior.
- Admin User Accounts implementation checks: `corepack yarn lint` and
  `git diff --check` passed. TypeScript still reports the pre-existing
  readonly-history mismatch in `src/components/layouts/hr/HrWorkflowContext.tsx:143`;
  no new User Accounts type error was emitted. The production build is blocked
  before compilation because the Android/ARM64 Next.js SWC binary is
  unavailable. Browser visual, responsive, keyboard, accessibility, and route
  smoke checks were not run because a browser runtime is unavailable.
- Admin User Accounts overflow correction review: Passed. The page now relies
  on the shared dashboard-card containment, modal descendants have explicit
  shrink boundaries, long confirmation text can wrap, and the last table action
  menus open upward instead of expanding the workspace. No global page-level
  `overflow-x: hidden` rule was added.
- Integration Errors uses deterministic mock error records and frontend-only
  retry/acknowledgement state; it has no live error feed or external retry
  behavior.
- User Accounts uses deterministic mock account data and frontend-only access
  actions; it has no live authentication provider or persistence.
- The Payroll Integration route uses mock data and has no production payroll
  API, transfer, calculation, or financial-processing behavior.
- The Accounting Integration route uses mock data and has no production
  Accounting API, posting, journal, ledger, calculation, or financial-report
  behavior.
- Feature data persistence, domain API contracts, and external system
  integrations remain intentionally out of scope; authentication/session
  handling is now backed by Firebase.
- The Employee Announcements route and Navbar notification synchronization use
  deterministic local data and have not received browser visual, responsive,
  keyboard, accessibility, or route smoke verification because of the same
  Android/ARM64 SWC limitation.
- The Employee Help & Support route uses deterministic local content and a
  frontend-only support-request prototype. It has not received browser
  visual, responsive, keyboard, accessibility, or route smoke verification
  because of the same Android/ARM64 SWC limitation.
- The Employee Attendance QR demo uses one scoped localStorage record with
  current-campus-day and employee validation, but its persistence, same-tab,
  cross-tab, reset, and timestamp behavior remain unverified in a browser
  because of the same Android/ARM64 SWC limitation. The QR itself remains a
  visual prototype and is not scannable.
- The Employee My Attendance monthly calendar keeps deterministic local mock
  statuses for historical dates, while the current campus day uses the
  server-derived Firebase attendance state. Month/year navigation remains
  unverified in an authenticated browser; the page does not edit or persist
  attendance records.
- The Employee Payslips details modal uses deterministic frontend payroll
  records and remains unverified in a browser because of the same Android/ARM64
  SWC limitation. It is read-only and has no functional download or payroll
  calculation behavior.
- The Accounting Staff dashboard implementation checks passed with
  `corepack yarn lint`, `npx tsc --noEmit`, and `git diff --check`. The
  production build reached Next.js but is blocked before compilation because
  this Android/ARM64 environment does not have the required
  `@next/swc-android-arm64` binary. Browser visual, responsive, keyboard,
  accessibility, and route smoke checks were not run because the frontend
  runtime could not start.
- The Accounting Integration Status migration checks passed with
  `corepack yarn lint`, `npx tsc --noEmit`, and `git diff --check`. The
  production build remains blocked before compilation by the unavailable
  Android/ARM64 Next.js SWC binary. Browser visual, responsive, keyboard,
  accessibility, and route smoke checks were not run because the frontend
  runtime could not start.
- Firebase foundation verification checks passed with `corepack yarn lint`,
  `npx tsc --noEmit`, a Node private-key parse, and a read-only Firebase
  Admin/Firestore probe. `/api/v1/health` and `/api/v1/health/firebase` both
  returned HTTP 200 with safe responses on three repeated requests through the
  running local process. A fresh Next.js start and production build remain
  blocked in this Android/ARM64 environment by the unavailable SWC binary.
- Firebase development seeder checks passed with `corepack yarn lint`,
  `corepack yarn tsc --noEmit`, `git diff --check`, the default and named dry
  runs, help output, invalid-name non-zero handling, and write-guard refusal.
  After the user confirmed credential rotation, Firebase health passed, the
  first real seed completed, and the second full seed reported all 4 employees
  and 4 users unchanged. Read-only verification confirmed 4 Auth users, 4
  matching `users/{uid}` documents, 4 employee documents, and 2 valid employee
  links. The first attempt exposed a short prototype password rejected by
  Firebase; a seed-only compatibility mapping fixed it without changing Login.
  The production build remains blocked before compilation by the unavailable
  Android/ARM64 Next.js SWC binary.

- Authenticated user and employee-info integration checks passed with
  `corepack yarn lint`, `corepack yarn tsc --noEmit`, and `git diff --check`.
  Firebase health returned HTTP 200, unauthenticated `/api/v1/me` returned
  the expected 401, and fresh custom-token session tests returned the expected
  user context for Admin, HR, Employee, and Accounting. Role dashboard routes
  returned HTTP 200. The production build remains blocked before compilation
  by the unavailable Android/ARM64 Next.js SWC binary; browser visual and
  responsive checks remain unavailable in this environment.

- Login form alignment fix: the desktop panels now share the available width,
  the login card is capped at 380px and centered within the login panel, and
  the stacked mobile panel is explicitly full width. ESLint, TypeScript
  `--noEmit`, and `git diff --check` passed. Browser visual verification was
  not available in this environment.

- The root application metadata now uses `/images/new-au-logo.png` for favicon,
  shortcut, and Apple-touch icons. The default App Router favicon was removed;
  ESLint, TypeScript `--noEmit`, and `git diff --check` passed. Browser tab
  verification was not available in this environment.

- The Firebase development seeder now includes ten fictional rank-and-file
  Employee accounts with string IDs `001` through `010`, stable username-based
  seed UIDs, active Employee roles/statuses, and linked employee references.
  Existing role and legacy Employee seed UIDs remain compatible. Their visible
  development passwords follow `aujsc.<three-digit-id>`; Firebase Auth receives
  the same values through the existing server-side compatibility adapter.
  Default and named dry-runs, fixture mapping, password compatibility, ESLint,
  TypeScript, and `git diff --check` passed. Real Firebase writes were not run
  because the local development seed guards are not configured.

- TASK-080 now uses the existing server-authenticated context for the Employee
  Dashboard: `Firebase session → users/{uid} → employeeId → employees/{employeeId}`.
  The dashboard welcome surface displays the linked Employee name, ID,
  department, and position; a missing employee reference renders a safe
  unavailable state instead of dashboard feature data. Attendance, payroll,
  and announcements remain on their existing prototype data sources. Lint,
  TypeScript, focused identity-boundary assertions, `git diff --check`, and
  production build passed. Runtime smoke checks returned dashboard redirect
  307, `/api/v1/me` 401 without a session, and Firebase health 200. Authenticated
  multi-employee browser checks were not run because the ten demo users have
  not been physically seeded and browser Email/Password sign-in remains
  unavailable in the configured Firebase project.

- TASK-081 now keeps the Employee Profile read-only and sourced from the
  authenticated `SessionUser` plus validated `EmployeeReference`. It displays
  the real Employee name, ID, department, position, employment status,
  username, and system role, removes mock schedule/attendance fields, and
  renders a safe unavailable state when the employee reference is missing.
  ESLint, TypeScript, focused profile-boundary assertions, `git diff --check`,
  production build, profile route protection (307), `/api/v1/me` (401 without
  a session), and Firebase health (200) passed. Browser visual/responsive and
  authenticated multi-employee checks remain unavailable because the configured
  Firebase demo accounts/provider are not ready for browser login.

- TASK-085 now resolves the Employee Dashboard’s attendance summary, today’s
  attendance, recent history, and latest payslip fixture by linked employee ID.
  Demo employees `001` through `009` have distinct development values, while
  Facilities employee `010` has zero metrics, no attendance record/history,
  and no payslip so empty states can be tested. Campus announcements remain
  shared because they are not employee-specific records. These are frontend
  development fixtures; the Firebase seed contract still only covers users and
  employee references, and no physical Firebase dashboard records were written.
  ESLint, production build, and `git diff --check` passed. Authenticated
  browser verification was not run because the configured Firebase provider and
  demo accounts are not ready for browser login.

- TASK-086 now removes the QR Scanner entry from the HR sidebar and adds the
  existing `/hr/scanner` route as a top-navbar QR scanner icon, matching the
  Admin navbar pattern. The separate HR scanner route remains protected by the
  HR layout. ESLint, production build, and `git diff --check` passed. Browser
  visual/responsive verification was not run.

- TASK-087 now makes the HR navbar scanner link open the canonical `/scanner`
  route. The old `/hr/scanner` path is only a redirect alias, so the scanner
  implementation and authorization remain centralized in the shared route.
  ESLint, production build, and `git diff --check` passed. Browser navigation
  verification was not run.

- TASK1 / TASK-082 now verifies the permanent employee-specific QR contract for
  seeded IDs `001` through `010`: each token is unique and stable, round-trips
  to its exact employee ID, contains only the employee ID payload, and rejects
  random and tampered values. The QR crypto contract is separated from the
  server-only environment wrapper so it can be checked without Firebase
  writes. The duplicate `/hr/scanner` implementation was removed; the legacy
  path redirects globally to the guarded canonical `/scanner` route. ESLint,
  TypeScript, QR verification, production build, runtime redirect/guard checks,
  and `git diff --check` passed. Authenticated Firebase/Firestore resolution
  and camera verification for all ten employees remain unavailable until the
  configured provider, signing secret, and demo accounts are ready.

- TASK2 / TASK-084 now persists the real QR attendance flow. The existing QR
  endpoint remains the single scanner endpoint: invalid or tampered QR values
  stop before any attendance write; the first valid daily scan creates a
  `present` record, the next scan after the short technical duplicate window
  adds Time Out and changes the record to `completed`, and completed records
  are returned without mutation. Firestore transactions protect concurrent
  scans, operator metadata comes from the authenticated HR/Admin session, and
  the scanner displays Time In, Time Out, status, source, and controlled
  duplicate/completed results. The local `qr:attendance:verify` check covers
  IDs `001` through `010`, QR rejection, and the attendance state transitions.
  Live Firestore writes, authenticated browser scanning, and camera/responsive
  checks remain unavailable in this environment because Firebase Auth/provider
  setup and the QR signing secret are not configured for the local runtime.

- TASK3 / TASK-085 now connects Employee My Attendance to the canonical
  Firestore attendance record. `GET /api/v1/attendance/me/today` requires the
  Employee role and derives the linked Employee ID from the verified session;
  it returns today's Asia/Manila record or a normal `attendance: null` empty
  state. The server-rendered page displays real Time In, Time Out, status, and
  per-action sources, keeps the existing actions/layout, removes local QR demo
  attendance from the page's authority, and distinguishes read failure from no
  record. Lint, TypeScript, production build, QR regressions, Firebase health,
  unauthenticated API/page smoke checks, and diff review passed. Authenticated
  multi-employee browser checks, live attendance reads, and visual/responsive
  checks remain unavailable because the configured Firebase Auth provider is
  not enabled for the local login flow.

- TASK4 / TASK-086 now connects Employee Attendance History to the canonical
  Firestore attendance collection. The server derives the authenticated
  Employee ID and lists only that employee's daily records in persisted
  attendance-date descending order. The page displays real date, Time In,
  Time Out, source, and status values; preserves the existing table, details
  drawer, filter layout, and read-only behavior; and makes month, status, date
  search, and pagination operate on real records. Missing records and read
  failures are distinct, unsupported schedule/late/absence/overtime values are
  shown as unavailable, and no browser-selected Employee ID or mock history
  fallback is used. Lint, TypeScript, production build, and the unauthenticated
  API guard check passed. Authenticated multi-employee, live Firestore,
  browser visual/responsive, and end-to-end scanner-to-history checks remain
  unavailable because the configured Firebase Auth provider is disabled for
  the local login flow.

- TASK5 / TASK-087 now connects the HR Dashboard to a server-side HR summary
  service. Active Employee count comes from valid Employee references with
  `employmentStatus = active`; Timed In Today counts current Asia/Manila daily
  records with Time-In; Completed Today counts canonical completed records with
  Time-Out; and Awaiting Time-Out counts current-day records with Time-In and
  no Time-Out. The existing cards, table, pending-actions panel, issue panel,
  and refresh control remain in place. Unsupported correction, verification,
  schedule, lateness, absence, and overtime data are not fabricated. The
  protected `GET /api/v1/hr/dashboard/summary` endpoint uses the HR role guard.
  Lint, TypeScript, production build, Firebase health, unauthenticated HR API
  `401`, unauthenticated HR page `307`, and Employee attendance regressions
  passed. Authenticated HR browser, live Firestore summary, scanner-to-dashboard,
  and responsive visual checks remain unavailable because the configured
  Firebase Auth provider is disabled for local login.

- TASK5 / TASK-088 now connects HR Attendance Monitoring to the canonical
  Firestore `attendance` collection through the existing attendance repository.
  The protected server-rendered page joins valid Employee references, exposes
  URL-driven date/employee/department/status/source filters, supports page
  sizes of 10/25/50, and returns safe formatted DTOs for the existing table and
  read-only drawer. Unsupported prototype validation, verification, payroll,
  lateness, absence, and Bundy controls were removed from this authoritative
  view. Lint, production build, and diff review passed; authenticated live
  Firebase, browser, responsive, and scanner-to-monitoring checks remain
  unavailable because the configured Firebase Auth provider is disabled for
  local login.

- TASK6 / TASK-089 now connects HR Employee Directory to the canonical
  Firestore `employees` collection through the existing Employee repository.
  The protected server-rendered page passes safe Employee reference fields to
  the existing read-only Directory UI, preserving leading-zero IDs and using
  real name, department, position, and employment-status values. Search,
  department, position, and employment-status filters remain client-side
  presentation state over the server-loaded records. Schedule, HRPS workflow,
  attendance-count, correction-count, and all Employee CRUD controls are not
  presented as Directory authority. Lint, production build, and diff review
  passed; authenticated live Firestore, browser, responsive, and role access
  checks remain unavailable because the configured Firebase Auth provider is
  disabled for local login.

- TASK7 / TASK-090 now connects HR Employee Schedules to the canonical Employee
  repository and an idempotent development-only `employeeSchedules/{employeeId}`
  HRPS reference model. The protected server-rendered page preserves the
  existing read-only schedule UI, joins Employee IDs `001` through `010`, uses
  structured local `HH:mm` values, removes unsupported day-status/leave/HRPS
  status claims, and distinguishes missing references from query failure. The
  guarded schedules seeder is non-destructive and has not been run against
  Firebase in this environment. Lint, TypeScript, production build, and diff
  review passed; authenticated live Firebase, browser, responsive, and role
  access checks remain unavailable because the configured Firebase Auth
  provider is disabled for local login.

- TASK3 now gives the shared scanner result panel distinct visual feedback for
  fresh Time In / Time Out records, already-completed attendance, and duplicate
  scans. Fresh attendance results use a restrained success entrance/pop
  animation, while duplicate and completed results use neutral or warning
  icons without presenting them as new attendance writes. The animation honors
  `prefers-reduced-motion`, and the existing five-second result reset remains
  unchanged.

- TASK4 now replaces the Employee Payslip page's local prototype records with
  server-side reads from the employee-scoped `payrollPayslips` integration
  snapshot collection. The server derives employee ownership from the
  authenticated Employee context, maps safe serializable DTOs, and preserves
  the existing Per Cutoff / Monthly read-only UI, filters, pagination, and
  details modal. Explicit development seed snapshots cover all ten demo
  employees, including Facilities `010`, without calculating payroll in SIA.
  TypeScript, production build, and diff review passed. The guarded Firebase
  seed dry-run was unavailable because local tsx/esbuild returned Windows
  `spawn EPERM`; no Firebase writes or authenticated browser checks were run.

- TASK8 / TASK-092 now completes the HR Attendance Correction Review workflow.
  `/hr/correction-requests` loads persisted correction requests server-side,
  exposes pending/approved/rejected history, and sends only a request ID,
  decision, and optional review note to the protected HR-only API. Approval
  uses a Firestore transaction to verify the pending state, employee and
  attendance relationships, the original snapshot, and the requested time
  fields before updating attendance. Rejection updates only the request. Both
  paths persist reviewer and decision metadata, while approved attendance
  keeps the original correction snapshot and correction metadata. A
  deterministic `corrections` development seeder creates pending requests and
  supporting attendance records without overwriting existing decisions. Lint,
  TypeScript, production build, and diff review passed; the seeder could not be
  run against Firebase and authenticated browser/API verification remains
  unavailable because local Firebase Auth is disabled.

- The Employee Dashboard `Days Present` summary card now uses the
  authenticated employee's server-loaded attendance-history count instead of
  the stale per-user fixture value. Employees with a real Present or Completed
  attendance record are represented in the card, while history failures use a
  safe fallback rather than claiming zero records. TypeScript, lint, production
  build, and diff checks passed; authenticated browser verification remains
  unavailable because local Firebase Auth is disabled.

- The Employee Dashboard welcome block now has explicit spacing and line height
  between its date, greeting, description, position, and Employee ID details.
  Its existing live date/time behavior and content are unchanged.

- Employee layout and page styles now use `Arial, Helvetica, sans-serif`
  consistently. Employee-scoped `Georgia`, `Times New Roman`, and `serif`
  declarations were removed without changing Admin, HR, or Login typography.

- The entire My Attendance Next steps / Attendance actions section was removed,
  including its unused quick-actions component and styles. The Today
  attendance, calendar, reminders, and support sections remain.

- The My Attendance reminders and support cards were removed from the page,
  along with their unused data exports and CSS. The Today attendance and
  monthly calendar sections remain.

- The My Attendance calendar now reads all persisted attendance dates for the
  authenticated employee through the shared Attendance Repository. It no
  longer uses hardcoded demo dates or unsupported late/absent statuses; real
  records show Present and other past dates show No Record.

- The Employee QR page now keeps only the centered personal QR card. The
  static attendance instructions, security notice, and their unused data and
  styles were removed.

- Employee typography no longer uses extra-bold `800` declarations. The former
  `600` weights were reduced to `500`, with selected `700` emphasis retained
  for primary headings and actions. Admin, HR, and Login typography was
  unchanged.

- The Employee Settings page now exists at `/employee/settings` inside the
  protected Employee shell. It provides accessible attendance-reminder and
  announcement-update preferences saved to the current device, plus links to
  the Employee Profile and Help & Support pages. No employee settings backend
  was introduced.

- The Employee sidebar now uses the transparent `aulogo.png` asset at a larger
  48px display size. Its previous white circular background and padding were
  removed so the logo matches the Admin and HR sidebar treatment.

- The private `Workflows/migration/` workspace now contains the six requested
  Payroll/Accounting source files imported from `origin/mai` and the three
  Jerzel Payroll source files imported from `origin/jerzel`. These remain
  static migration references; no Next.js routes or backend behavior were
  changed by the import.

- TASK-107 now migrates the Jerzel Payroll History prototype to the protected
  `/payroll/history` route. The Payroll sidebar link is active, and the page
  provides read-only local historical batch data, summary metrics, period,
  batch, transfer, result, and text filters, pagination, an accessible details
  dialog, empty-state feedback, and responsive table overflow. No payroll
  mutation or Existing Payroll System integration was added. Lint, TypeScript,
  production build, CSS import resolution, unauthenticated route protection,
  and diff checks passed; authenticated browser and visual/responsive checks
  remain unavailable in this environment.

- TASK-108 now migrates the Accounting Approved Payroll Information view to the
  protected `/accounting/approved-payroll` route. The Accounting sidebar and
  navbar title are active, and the page presents the existing read-only
  accounting payroll snapshot with summary metrics, search, period/approval/
  accounting filters, pagination, an accessible details dialog, empty-state
  feedback, and responsive table overflow. No payroll calculation, approval
  mutation, or external accounting write was added. Lint, TypeScript,
  production build, CSS import resolution, unauthenticated route protection,
  and diff checks passed; authenticated browser and visual/responsive checks
  remain unavailable in this environment.

- TASK-109 now connects the protected Employee Attendance QR page to the
  authenticated `GET /api/v1/attendance/me/today` flow. The page establishes
  the server-loaded attendance as a non-animated baseline, polls every 2.5
  seconds while the page is visible and attendance is incomplete, pauses
  requests while hidden, and detects real Time-In and Time-Out transitions.
  It shows restrained success feedback with authoritative Asia/Manila times,
  persistent waiting-for-Time-Out and completed states, both saved times when
  attendance is already complete, and a retryable status error without
  removing the valid QR. No localStorage, direct browser Firestore access, or
  attendance mutation was added. Lint, TypeScript, production build, QR
  attendance verification, and diff checks passed; authenticated browser and
  visual/responsive checks remain unavailable because Firebase Auth browser
  verification is disabled in this environment. The current QR signing
  contract has no expiry field, so no new expiry behavior was introduced.

- TASK-111 now connects `/payroll/verified-attendance` to the protected
  Payroll API and server-side Payroll Verified Attendance service. The service
  consumes canonical Attendance, Employee, and correction repositories, groups
  only records with an explicit persisted `attendance.hrVerification.status`
  of `verified` into employee-period summaries, derives readiness and blocking
  reasons on the server, and returns real departments, counts, filters, and
  pagination. Approved corrections are not treated as HR final verification.
  The attendance parser now safely accepts the optional HR verification
  metadata contract; because the current HR workflow still stores verification
  only in the client prototype, the page currently shows truthful zero/empty
  states rather than sample records. TASK-112 now supplies the persistent batch
  boundary used by this page, so Included/Submitted statuses and Add to Batch
  actions are backed by server validation rather than fabricated locally.
  Loading, error, empty, retry, disabled-selection, read-only detail, and
  reduced-motion states were preserved within the existing Payroll design.
  Lint, TypeScript, production build, unauthenticated page/API smoke checks,
  and diff review passed. Authenticated browser, live Firestore, visual, and
  responsive checks remain unavailable because Firebase Email/Password is
  disabled in the configured environment.

- TASK-112 now makes `/payroll/batches` a protected Firestore-backed workflow.
  `payrollBatches` stores payroll-period metadata, lifecycle status, real counts,
  actor/timestamp fields, and immutable employee-period snapshots; a separate
  membership collection prevents the same verified-attendance summary from
  being included in conflicting batches. Payroll APIs validate HR verification,
  payroll readiness, period matching, Draft-only removal, and Draft → Ready →
  Submitted transitions on the server. Verified Attendance can now create a
  persistent Draft batch from selected Ready records and displays real batch
  status. Empty, error, unauthorized, read-only, and responsive table/modal
  states remain covered by the existing Payroll UI patterns. Lint, TypeScript,
  production build, unauthenticated page/API smoke checks, and diff checks
  passed. Authenticated Firebase writes, browser visual, and responsive checks
  remain unavailable because Firebase Email/Password is disabled in the
  configured environment.

- TASK-113 now makes `/payroll/handoff` a protected Firestore-backed transfer
  workflow. `payrollHandoffs` stores immutable Payroll Batch snapshots, server
  actors and timestamps, stable transfer IDs, separate transfer and
  acknowledgement statuses, external references, attempts, and safe failure
  details. Payroll APIs revalidate Ready batches, prevent duplicate/concurrent
  normal submissions, and construct adapter payloads on the server. Because no
  live Existing Payroll API contract or credentials exist in the repository, the
  server uses an explicitly named deterministic simulated adapter; it never
  claims live Payroll processing or calculates salary. The Handoff page now uses
  real records, server-backed filters/pagination, real timelines and empty/error/
  loading states. Successful handoff acceptance advances a batch to Submitted;
  failed handoffs remain persisted and require technical follow-up. Dashboard
  transfer counts and alerts now read the same repositories. Lint, TypeScript,
  production build, unauthenticated page/API smoke checks, and diff checks
  passed. Authenticated browser, live Firestore, visual, and responsive checks
  remain unavailable because Firebase Email/Password is disabled in the
  configured environment.

- TASK-114 now makes `/payroll/results` a protected Firestore-backed returned
  Payroll Result workflow. Accepted Handoff adapter responses are validated
  against immutable Batch snapshots and persisted as stable result records with
  employee-level processing statuses, separate payslip statuses, external
  references, lifecycle counts, timestamps, and safe result audit events.
  Available returned payslips idempotently upsert the existing employee-scoped
  `payrollPayslips` collection without locally calculating monetary values. The
  Results page now uses real server data, validated APIs, filters, pagination,
  batch aggregation, notices, details, loading/error/empty states, and refresh;
  fixture rows and hardcoded counts are removed. TypeScript, lint, production
  build, unauthenticated page/API guards, prototype scan, and diff checks
  passed. Authenticated Firebase ingestion, employee payslip access, browser
  visual, and responsive checks remain unavailable because Firebase
  Email/Password is disabled in the configured environment.

- TASK-115 now makes `/payroll/history` a protected read-only Payroll lifecycle
  projection over the persistent Batch, Handoff, and Result repositories. One
  history row represents one real Payroll batch; lifecycle status, completion,
  summary metrics, search, filters, pagination, issue summaries, and timelines
  are derived server-side from the upstream records. Failed handoffs, awaiting
  results, rejected results, and completed-with-issues cycles remain visible.
  The existing History UI now uses real loading, empty, error, refresh, table,
  and detail states, and no separate `payrollHistory` collection or payroll
  calculation was introduced. TypeScript, lint, production build,
  unauthenticated page/API guards, prototype scan, and diff checks passed;
  authenticated Firestore, browser visual, responsive, and lifecycle data
  checks remain unavailable because Firebase Email/Password is disabled.

- ACC-BACK-001 now makes `/accounting/approved-payroll` a protected read-only
  projection over persistent Payroll Results. The server derives Accounting
  readiness, preserves historical Payroll Result/Batch/Handoff references and
  counts, supports validated filters and pagination, and leaves returned
  monetary totals unavailable because the current result contract does not
  provide them. No Accounting transfer persistence or Payroll calculation was
  added. TypeScript, lint, production build, focused readiness checks,
  unauthenticated page/API smoke checks, and diff review passed; authenticated
  Firestore and browser visual/responsive checks remain unavailable because
  Firebase Email/Password is disabled.

- ACC-BACK-003 now makes `/accounting/transaction-history` a protected,
  read-only projection over the existing Accounting Transfer repository and
  Payroll Result repository. The server derives lifecycle status, summary
  counts, Payroll period/reference, submitter, acknowledgement, completion or
  failure timestamps, issue state, real filters, pagination, and detail
  timelines from persisted records and existing Accounting transfer audit
  events. The page no longer uses fixture rows, fake references, fake amounts,
  or a duplicate history collection; its existing table, filters, internal
  overflow, and detail dialog remain in place with real loading, empty, error,
  refresh, and unauthorized API behavior. TypeScript, lint, production build,
  unauthenticated page/API smoke checks, prototype-marker scan, diff check,
  and final review passed. Authenticated Firestore, browser visual/responsive,
  and lifecycle-data checks remain unavailable because Firebase
  Email/Password is disabled in the configured environment.

- ACC-BACK-004 now makes `/accounting/dashboard` a protected real-data
  aggregate over the existing Approved Payroll, Accounting Transfer, and
  Transaction History services. Summary cards, latest Payroll Result details,
  contextual integration-flow states, health rows, recent activity, and alerts
  are derived from persisted records with no dashboard collection, duplicate
  lifecycle state machine, fake amounts, or fixture fallback. The existing
  dashboard composition was preserved and now has server-loaded, refreshable,
  loading, empty, error, and unauthorized behavior. TypeScript, lint,
  production build, unauthenticated API/page smoke checks, prototype-marker
  scan, and diff review passed; authenticated Firestore, browser visual,
  responsive, and lifecycle-data checks remain unavailable because Firebase
  Email/Password is disabled in the configured environment.

- ADMIN-BACK-001 now makes `/admin/integration-monitoring` a protected
  real-data technical monitoring projection over the existing employee,
  schedule, attendance, Payroll Handoff, Payroll Result, and Accounting
  Transfer repositories. The page derives integration modes, health, pending
  operations, technical issues, persisted activity, and flow status on the
  server; Payroll and Accounting simulated adapters and the missing Bundy
  adapter are labeled truthfully. Fixture cards, fake synchronization events,
  fake issues, fake retry actions, and unsupported percentages were removed.
  Loading, empty, error, refresh, search, status filtering, API 401 behavior,
  TypeScript, lint, production build, and diff checks passed. Authenticated
  Firebase role/lifecycle, browser visual, responsive, and retry checks remain
  unavailable because Firebase Email/Password is disabled and the current
  monitoring boundary has no safe IT Admin retry service.

- PAYROLL-UI-001 removes the visible bottom provider and boundary disclaimer
  notices from the Payroll Dashboard, Verified Attendance, Batches, Handoff,
  Results, and History workspaces. Real Payroll Result follow-up alerts remain
  because they are derived from persisted records. No Payroll backend or
  adapter behavior changed. TypeScript, lint, and diff checks passed.

- ADMIN-BACK-002 now makes `/admin/user-accounts` a protected full-stack
  Firebase Authentication and Firestore application-profile manager. The
  server-only AdminUserAccountService joins Firebase Auth identities with the
  existing `users/{uid}` profiles and read-only Employee/HRPS references,
  derives real metadata and summary counts, supports server-side search,
  role/status/link filters and pagination, and returns no credentials. Admins
  can create accounts, assign canonical roles, link existing employees,
  update profile metadata, and enable or disable Firebase identities through
  protected APIs. Duplicate emails and active employee links are rejected;
  employee roles require an existing employee link; self-disable,
  self-demotion, and last-active-admin changes are blocked. Account-management
  audit events are persisted separately, creation rolls back a partial Auth
  account if the profile cannot be written, and no custom claims or second
  authentication system were introduced. The existing admin composition was
  preserved with real loading, empty, error, details, modal, and responsive
  states. TypeScript, lint, production build, and diff checks passed;
  authenticated Firebase lifecycle, browser visual, responsive, and mutation
  checks remain unavailable because Firebase Email/Password is disabled in the
  configured environment.

- ADMIN-BACK-005 now makes `/admin/settings` a protected full-stack technical
  configuration workspace. The existing settings UI now reads controlled
  runtime values from the Firestore `systemSettings/runtime` document through
  a server-only registry, repository, and AdminSettingsService. Supported
  display, workspace, attendance-view, and Audit Logs preferences are
  server-validated, versioned, persisted, resettable to controlled defaults,
  and audited through the centralized `auditEvents` collection. Integration
  cards now derive truthful HRPS/local, Bundy/not-configured, QR secret-status,
  Payroll/simulated, and Accounting/simulated facts without exposing secrets
  or external credentials. `admin.settings.view` protects reads and
  `admin.settings.manage` protects writes; read-only environment/derived values
  and unknown keys are rejected server-side. Audit Logs consumes its persisted
  page-size and default-outcome preferences. TypeScript, lint, production
  build, unauthenticated API/page smoke checks, security scan, and diff checks
  passed. Authenticated Firebase persistence, browser visual/responsive, and
  role-specific mutation checks remain unavailable because Firebase
  Email/Password is disabled in the configured environment.

- ADMIN-BACK-006 now makes `/admin/dashboard` a protected real-data technical
  aggregate over Integration Monitoring, User Accounts, Roles & Permissions,
  Audit Logs, and System Settings. The dashboard no longer imports the static
  admin fixture data or fabricates timestamps, health, counts, activity, or
  alerts. `AdminDashboardService` builds one server-side read model from the
  existing domain services, exposes it through `GET /api/v1/admin/dashboard`,
  and enforces `admin.dashboard.view` in both the page and API. The existing
  dashboard composition now has real integration health and activity,
  account/RBAC/configuration summaries, technical alerts, refresh, loading,
  empty, error, and unauthorized behavior. No dashboard collection, mutation,
  business authority, or secret exposure was added. TypeScript, lint, static
  mock/security scans, and diff checks passed. Next.js compilation succeeded,
  but runtime/dev-server and final build TypeScript process checks were blocked
  by `spawn EPERM`; authenticated Firebase, browser visual, responsive, and
  cross-page reconciliation checks remain unavailable because the environment
  cannot start Next.js and Firebase Email/Password is disabled.

- The Accounting, Payroll, and HR navbar profile triggers now explicitly style
  their shared user-avatar icons for the light navbar surface. The user icon
  remains visible at desktop, tablet, and mobile widths while the existing dark
  sidebar avatar styling remains unchanged. TypeScript, lint, and diff checks
  passed; browser visual verification remains unavailable because the local
  Next.js runtime is blocked by `spawn EPERM`.

- ADMIN-BACK-002 revision now completes `/admin/user-accounts` account
  lifecycle management. Create/read/update remain backed by Firebase Auth,
  application profiles, and existing employee references; Disable and Enable
  use explicit protected endpoints; and Permanent Delete removes only the
  Firebase identity, application profile, and current employee-account link.
  Final-admin and self-delete protection, profile rollback on Auth deletion
  failure, `DELETE` confirmation, and immutable account-management audit
  snapshots are in place. Attendance, HRPS, Payroll, Accounting, and Audit
  History records are not cascaded. TypeScript, lint, production build, and
  diff checks passed; authenticated Firebase lifecycle and browser visual/
  responsive checks remain unavailable in this environment.

## SYSTEM-CLEAN-002 Cleanup Snapshot

The confirmed prototype/dead-code cleanup is complete. Seven legacy Admin
integration pages and their static data/components/styles were removed from the
route graph and navigation. The unused HR in-memory workflow provider and
static workflow records, the unused Employee QR demo hook/storage utility, and
the old static Employee dashboard/support submission data were removed. The
Employee dashboard now renders only server-derived attendance plus truthful
unavailable states for unsupported announcements/payslip summary; Employee
settings remains explicitly device-local preference state. HR dashboard UI
types were moved out of the removed static HR data module. The HRPS employee
seed module remains because Firebase seed scripts use it.

Live API routes, server repositories/services, canonical audit/RBAC/settings
boundaries, Payroll and Accounting simulated adapters, historical data
compatibility, and development seed data were preserved. Monitoring and
settings links now point to the real Admin Integration Monitoring boundary.
The current route graph contains the real portal pages only; removed legacy
pages no longer have direct source route files.

Verification passed for TypeScript, production build, lint with one existing
unused-helper warning in `src/server/repositories/payroll/payslip.repository.ts`,
and `git diff --check`. Authenticated Firebase, live-provider, browser,
responsive, visual, keyboard, accessibility, and runtime smoke checks were not
available in this environment. The next implementation priority remains
`SYSTEM-FIX-002` for server-authoritative HR final verification and Payroll
readiness.

## Next Likely Work

1. `SYSTEM-FIX-002`: persist HR final verification through a protected
   server/API command and connect it to Payroll readiness.
2. `HR-CORR-002`: connect Employee correction submission to the persisted HR
   review workflow.
3. `SYSTEM-SEC-004`: add direct page guards for HR directory and schedule
   routes.
4. `SYSTEM-DATA-003`: normalize active status/DTO/type mappings after the
   higher-priority workflow fixes.

## SYSTEM-DATA-004 Consistency Audit Snapshot

`SYSTEM-DATA-004` is complete. The active Payroll and Accounting contracts now
reuse canonical status registries at the API and Firestore parser boundaries.
Approved Payroll explicitly uses a projection type that includes
`not_transferred`, while persisted Accounting transfer records retain only
their actual transfer lifecycle values. Payroll Result, employee-level result,
payslip, Payroll Batch, Payroll Handoff, Accounting acknowledgement, and UI-only
filter states remain distinct. No persisted field rename or data migration was
performed.

TypeScript and the production build passed. Lint passed with the existing
unused-helper warning in `src/server/repositories/payroll/payslip.repository.ts`;
`git diff --check` passed. Browser, responsive, accessibility, authenticated
Firebase, live-provider, and mutation checks were not run because the configured
environment cannot provide those checks.

The next implementation priority remains server-authoritative HR final
verification and Payroll readiness, followed by Employee correction submission
and direct HR route guards.
