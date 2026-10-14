# DB-ARCH-006 - Proposed PostgreSQL ERD

This Mermaid diagram is the proposed target domain shape. It is intentionally
not a live schema and does not include future Bundy/HRPS import tables until
their contracts are approved.

```mermaid
erDiagram
    APPLICATION_ROLES ||--o{ USERS : assigns
    APPLICATION_ROLES ||--o{ ROLE_PERMISSIONS : grants
    PERMISSIONS ||--o{ ROLE_PERMISSIONS : contains
    EMPLOYEES ||--o{ USERS : optionally_links
    EMPLOYEES ||--o{ EMPLOYEE_SCHEDULES : has
    EMPLOYEES ||--o{ ATTENDANCE_RECORDS : records
    EMPLOYEES ||--o{ ATTENDANCE_CORRECTIONS : requests
    ATTENDANCE_RECORDS ||--o{ ATTENDANCE_CORRECTIONS : corrects
    PAYROLL_BATCHES ||--o{ PAYROLL_BATCH_ITEMS : contains
    EMPLOYEES ||--o{ PAYROLL_BATCH_ITEMS : snapshots
    PAYROLL_BATCHES ||--o| PAYROLL_HANDOFFS : hands_off
    PAYROLL_HANDOFFS ||--o| PAYROLL_RESULTS : returns
    PAYROLL_RESULTS ||--o{ PAYROLL_RESULT_ITEMS : contains
    EMPLOYEES ||--o{ PAYROLL_RESULT_ITEMS : identifies
    EMPLOYEES ||--o{ PAYROLL_PAYSLIPS : receives
    PAYROLL_RESULT_ITEMS ||--o{ PAYROLL_PAYSLIPS : may_release
    PAYROLL_RESULTS ||--o| ACCOUNTING_TRANSFERS : transfers
    USERS ||--o{ AUDIT_EVENTS : acts

    APPLICATION_ROLES {
        uuid id PK
        text code UK
        text label
    }
    PERMISSIONS {
        uuid id PK
        text key UK
        text category
    }
    ROLE_PERMISSIONS {
        uuid role_id FK
        uuid permission_id FK
        integer version
        jsonb updated_by_snapshot
        timestamptz updated_at
    }
    USERS {
        uuid id PK
        text firebase_uid UK
        text username UK
        text display_name
        uuid role_id FK
        uuid employee_id FK
        text status
        timestamptz created_at
        timestamptz updated_at
    }
    EMPLOYEES {
        uuid id PK
        text employee_id UK
        text display_name
        text department
        text position
        text employment_status
        text source_system
        text legacy_firestore_id
        timestamptz synced_at
    }
    EMPLOYEE_SCHEDULES {
        uuid id PK
        uuid employee_id FK
        text schedule_id
        time work_start
        time work_end
        time break_start
        time break_end
        text shift_label
        jsonb work_days
        jsonb rest_days
        text work_location
        date effective_from
        date effective_to
    }
    ATTENDANCE_RECORDS {
        uuid id PK
        uuid employee_id FK
        date attendance_date
        timestamptz time_in
        timestamptz time_out
        text time_in_source
        text time_out_source
        text status
        jsonb time_in_actor_snapshot
        jsonb time_out_actor_snapshot
        jsonb correction_metadata
        jsonb hr_verification
        timestamptz updated_at
    }
    ATTENDANCE_CORRECTIONS {
        uuid id PK
        uuid employee_id FK
        uuid attendance_record_id FK
        date attendance_date
        text issue_type
        text status
        text reason
        jsonb original_snapshot
        jsonb requested_changes
        jsonb resulting_snapshot
        jsonb changed_fields
        jsonb evidence
        jsonb submitted_by_snapshot
        jsonb reviewed_by_snapshot
        timestamptz submitted_at
        timestamptz reviewed_at
    }
    PAYROLL_BATCHES {
        uuid id PK
        text batch_reference UK
        date period_start
        date period_end
        text period_label
        text status
        jsonb created_by_snapshot
        jsonb submitted_by_snapshot
        integer record_count
        integer blocked_count
        text notes
        timestamptz created_at
        timestamptz updated_at
    }
    PAYROLL_BATCH_ITEMS {
        uuid id PK
        uuid batch_id FK
        uuid employee_id FK
        text employee_period_id UK
        date period_start
        date period_end
        text employee_id_snapshot
        text employee_name_snapshot
        text department_snapshot
        integer present_days
        integer late_count
        integer late_minutes
        integer undertime_minutes
        jsonb source_attendance_ids
        timestamptz snapshot_created_at
    }
    PAYROLL_HANDOFFS {
        uuid id PK
        uuid batch_id FK
        text transfer_id UK
        text transfer_status
        text acknowledgement_status
        text provider
        text external_reference
        integer attempt_count
        jsonb batch_summary_snapshot
        jsonb failure
        timestamptz submitted_at
        timestamptz acknowledged_at
        timestamptz failed_at
    }
    PAYROLL_RESULTS {
        uuid id PK
        uuid batch_id FK
        uuid handoff_id FK
        text result_reference UK
        text external_payroll_reference
        text status
        text provider
        integer employee_count
        integer processed_count
        integer pending_count
        integer rejected_count
        integer failed_count
        integer payslip_available_count
        timestamptz received_at
        timestamptz completed_at
    }
    PAYROLL_RESULT_ITEMS {
        uuid id PK
        uuid result_id FK
        uuid employee_id FK
        text external_employee_reference
        text external_payroll_reference
        text processing_status
        text payslip_status
        text payslip_id
        text issue_code
        text issue_summary
        timestamptz processed_at
        timestamptz released_at
    }
    PAYROLL_PAYSLIPS {
        uuid id PK
        uuid employee_id FK
        uuid result_item_id FK
        date period_start
        date period_end
        text payroll_reference
        text status
        numeric gross_pay
        numeric total_deductions
        numeric net_pay
        jsonb deductions
        jsonb monthly_summary_snapshot
        timestamptz released_at
    }
    ACCOUNTING_TRANSFERS {
        uuid id PK
        uuid payroll_result_id FK
        uuid payroll_batch_id FK
        uuid payroll_handoff_id FK
        text transfer_reference UK
        text transfer_status
        text acknowledgement_status
        text provider
        text external_accounting_reference
        integer attempt_count
        jsonb failure
        timestamptz submitted_at
        timestamptz acknowledged_at
        timestamptz failed_at
    }
    AUDIT_EVENTS {
        uuid id PK
        text event_type
        text action
        text module
        uuid actor_user_id FK
        jsonb actor_snapshot
        jsonb target_snapshot
        text outcome
        jsonb metadata
        text source_collection
        text legacy_document_id
        timestamptz occurred_at
    }
```

The diagram keeps important historical snapshots even where an FK also
exists. The FK provides current integrity; the snapshot preserves what the
external system or actor looked like at the time of the workflow event.
