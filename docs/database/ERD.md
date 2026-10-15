# DB-SCHEMA-008 - Implemented PostgreSQL ERD

This diagram reflects the Prisma 6.19.0 schema deployed by
`20261014120000_initial_sia_schema`. It intentionally excludes future HRPS and
Bundy import tables because those source contracts are not approved.

```mermaid
erDiagram
    APPLICATION_ROLES ||--o{ USERS : assigns
    APPLICATION_ROLES ||--o{ ROLE_PERMISSIONS : grants
    PERMISSIONS ||--o{ ROLE_PERMISSIONS : contains
    EMPLOYEES ||--o{ USERS : optionally_links
    EMPLOYEES ||--o{ EMPLOYEE_SCHEDULES : has
    EMPLOYEES ||--o{ ATTENDANCE_RECORDS : records
    USERS ||--o{ ATTENDANCE_RECORDS : operates
    EMPLOYEES ||--o{ ATTENDANCE_CORRECTIONS : requests
    ATTENDANCE_RECORDS ||--o{ ATTENDANCE_CORRECTIONS : corrects
    PAYROLL_BATCHES ||--o{ PAYROLL_BATCH_ITEMS : contains
    EMPLOYEES ||--o{ PAYROLL_BATCH_ITEMS : snapshots
    PAYROLL_BATCHES ||--o| PAYROLL_HANDOFFS : hands_off
    PAYROLL_BATCHES ||--o{ PAYROLL_RESULTS : groups
    PAYROLL_HANDOFFS ||--o| PAYROLL_RESULTS : returns
    PAYROLL_RESULTS ||--o{ PAYROLL_RESULT_ITEMS : contains
    EMPLOYEES ||--o{ PAYROLL_RESULT_ITEMS : optionally_resolves
    EMPLOYEES ||--o{ PAYROLL_PAYSLIPS : receives
    PAYROLL_RESULT_ITEMS ||--o{ PAYROLL_PAYSLIPS : may_release
    PAYROLL_RESULTS ||--o| ACCOUNTING_TRANSFERS : transfers
    PAYROLL_BATCHES ||--o{ ACCOUNTING_TRANSFERS : traces
    PAYROLL_HANDOFFS ||--o{ ACCOUNTING_TRANSFERS : traces
    USERS ||--o{ AUDIT_EVENTS : acts
    USERS ||--o{ SYSTEM_SETTINGS : updates

    APPLICATION_ROLES {
        uuid id PK
        enum code UK
        text label
        text description
    }
    PERMISSIONS {
        uuid id PK
        text key UK
        text category
        text description
    }
    ROLE_PERMISSIONS {
        uuid role_id PK_FK
        uuid permission_id PK_FK
        integer version
        jsonb updated_by_snapshot
        timestamptz updated_at
    }
    USERS {
        uuid id PK
        text firebase_uid UK
        text username UK
        uuid role_id FK
        uuid employee_id FK
        enum status
    }
    EMPLOYEES {
        uuid id PK
        text employee_id UK
        text display_name
        text department
        text position
        enum employment_status
        enum source_system
        text legacy_firestore_id UK
    }
    EMPLOYEE_SCHEDULES {
        uuid id PK
        uuid employee_id FK
        text schedule_id
        time work_start
        time work_end
        jsonb work_days
        jsonb rest_days
        date effective_from
        date effective_to
    }
    ATTENDANCE_RECORDS {
        uuid id PK
        uuid employee_id FK
        date attendance_date UK_PART
        timestamptz time_in
        timestamptz time_out
        enum time_in_source
        enum time_out_source
        enum status
        enum hr_verification_status
        enum payroll_readiness_status
    }
    ATTENDANCE_CORRECTIONS {
        uuid id PK
        uuid employee_id FK
        uuid attendance_record_id FK
        enum issue_type
        enum status
        jsonb original_snapshot
        jsonb requested_changes
        jsonb resulting_snapshot
        jsonb evidence
        jsonb submitted_by_snapshot
        jsonb reviewed_by_snapshot
    }
    PAYROLL_BATCHES {
        uuid id PK
        text batch_reference UK
        date period_start
        date period_end
        enum status
        jsonb created_by_snapshot
        integer record_count
        integer blocked_count
    }
    PAYROLL_BATCH_ITEMS {
        uuid id PK
        uuid batch_id FK
        uuid employee_id FK
        text employee_period_id
        text employee_id_snapshot
        jsonb source_attendance_ids
        enum hr_verification_status
        enum payroll_readiness_status
    }
    PAYROLL_HANDOFFS {
        uuid id PK
        uuid batch_id FK_UK
        text transfer_reference UK
        enum transfer_status
        enum acknowledgement_status
        text provider
        jsonb batch_summary_snapshot
        integer attempt_count
    }
    PAYROLL_RESULTS {
        uuid id PK
        uuid batch_id FK
        uuid handoff_id FK_UK
        text result_reference UK
        text external_payroll_reference
        enum status
        enum accounting_readiness_status
        integer employee_count
    }
    PAYROLL_RESULT_ITEMS {
        uuid id PK
        uuid result_id FK
        uuid employee_id FK
        text employee_id_snapshot
        text external_employee_reference
        enum processing_status
        enum payslip_status
    }
    PAYROLL_PAYSLIPS {
        uuid id PK
        uuid employee_id FK
        uuid result_item_id FK
        date period_start
        date period_end
        text payroll_reference UK
        numeric gross_pay
        numeric total_deductions
        numeric net_pay
        enum status
        jsonb monthly_summary
    }
    ACCOUNTING_TRANSFERS {
        uuid id PK
        uuid payroll_result_id FK_UK
        uuid payroll_batch_id FK
        uuid payroll_handoff_id FK
        text transfer_reference UK
        enum transfer_status
        enum acknowledgement_status
        text external_accounting_reference
    }
    AUDIT_EVENTS {
        uuid id PK
        enum actor_type
        uuid actor_user_id FK
        jsonb actor_snapshot
        text event_type
        text target_type
        text target_id
        enum outcome
        jsonb metadata
        timestamptz occurred_at
    }
    SYSTEM_SETTINGS {
        uuid id PK
        text setting_key UK
        jsonb overrides
        integer version
        uuid updated_by_user_id FK
    }
```

The schema uses UUID primary keys and preserves `employees.employee_id` as
text, including leading zeros. Historical actor and employee snapshots remain
alongside nullable user/employee foreign keys. Business-history foreign keys
use `RESTRICT` or `SET NULL`; only dependent Payroll batch/result children and
RBAC join rows use `CASCADE`. All application tables have RLS enabled without
browser policies, and no direct browser database access is part of the design.
