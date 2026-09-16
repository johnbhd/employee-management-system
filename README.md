# Employee Management

An integration-focused employee attendance system for non-teaching administrative and office-support employees of Arellano University – Juan Sumulong Campus.

## Project Description

This project connects the university's existing employee, attendance, payroll, and accounting systems while adding QR attendance and a unified integration layer. It is designed to reduce manual checking and transfer work without replacing the systems that already own those responsibilities.

```text
HRPS + Bundy/Biometric + QR Attendance
→ Unified Attendance Data
→ Validation and Processing
→ Approval
→ Existing Payroll System
→ Existing Accounting System
```

HRPS remains the source of official employee information, with the HRPS Employee ID intended as the master identifier for matching records.

## Intended Users

- Non-Teaching Employees
- HR / Attendance Staff
- Supervisors
- Payroll Staff
- Accounting Staff
- IT Administrators

## Confirmed Scope

- Standardize Bundy and QR attendance into a common attendance format.
- Detect invalid, duplicate, missing, or inconsistent attendance records.
- Support attendance validation, correction, approval, and verified attendance output.
- Provide payroll-ready attendance data for the existing Payroll System.
- Exchange approved payroll information with the existing Accounting System.
- Monitor integrations, synchronization, errors, permissions, users, and audit activity.

The project remains integration-first: the existing HRPS, Bundy/Biometric, Payroll, and Accounting systems stay in place.

## Current Prototype

The repository currently contains a static IT Administrator integration dashboard with:

- Integration health and synchronization summaries.
- Attendance Data Flow and Unified Attendance monitoring.
- Recent integration events and integration errors.
- Quick actions, audit activity, and UI-only feedback states.
- Reusable sidebar and navbar components with responsive behavior.

The dashboard uses mock data and makes no network calls to the external systems.

## Technology

- HTML, CSS, and browser-native JavaScript ES modules.
- Tailwind CSS loaded through the CDN.
- Static hosting or a local HTTP server for the prototype.
- No backend, database, package manifest, or real integration adapters are currently implemented.

## Project Structure

```text
index.html                         # Root login page
employee/dashboard.html            # Employee dashboard
admin/dashboard.html               # IT Administrator dashboard
admin/layout/sidebar.js            # Reusable sidebar component
admin/layout/navbar.js             # Reusable navbar component
css/admin.css                      # Custom admin dashboard styles
css/employee.css                   # Employee dashboard styles
css/login.css                      # Login page styles
js/admin/admin-layout.js           # Shared admin layout behavior
js/admin/dashboard.js              # Admin dashboard mounting and interactions
img/                               # Application image assets
```

## Run Locally

Serve the repository root with any static HTTP server. For example:

```sh
python3 -m http.server 8000
```

Open http://localhost:8000/ in a browser for the login page. The administrator dashboard is available at http://localhost:8000/admin/dashboard.html and the employee dashboard at http://localhost:8000/employee/dashboard.html.

## Current Limitations

- Backend persistence and real integrations are not implemented.
- Attendance rules, approval ownership, QR security behavior, and external identifier mappings still require confirmation.
- Tailwind CDN loading requires network access during rendering.
- Automated browser visual tests are not currently available.

## Scope Boundary

This project is an integration system, not a replacement HRPS, Payroll System, Accounting System, Bundy/Biometric system, or complete university ERP. Faculty attendance integration is outside the initial scope unless explicitly approved later.

## Data Boundary

Production implementation should store and transmit only the minimum necessary employee information. Biometric images/templates, passwords, salary information in QR codes, and unrelated HR data are outside the intended scope.

## Status

The current repository state is a static prototype focused on the IT Administrator monitoring experience.

Future work depends on confirmed beneficiary interfaces, data formats, attendance policies, and integration contracts.
