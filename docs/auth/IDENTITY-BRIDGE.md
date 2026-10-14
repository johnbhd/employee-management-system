# Firebase Authentication to PostgreSQL Identity Bridge

## Implemented boundary

```text
Firebase Authentication
        |
        | verified Firebase UID / session cookie
        v
Next.js server
        |
        | Prisma identity and authorization queries
        v
Supabase PostgreSQL
  users -> application_roles -> role_permissions -> permissions
        |
        v
  employees (only explicitly linked identity references)
```

Firebase Authentication remains responsible for credentials, login, token
verification, session cookies, password reset, and Firebase account lifecycle.
PostgreSQL is now the source of truth for application users, role assignment,
permission resolution, enabled/disabled application access, and explicit user
to Employee links. The browser never connects directly to PostgreSQL.

The identifiers remain distinct:

- Firebase UID: authentication-provider identity;
- PostgreSQL `users.id`: internal application identity;
- PostgreSQL `employees.employee_id`: HRPS institutional identifier, stored as
  text so leading zeros remain intact.

## Server implementation

- Canonical session lookup: `src/server/auth/session.ts`.
- Current application identity context: `src/server/auth/current-user-context.ts`.
- Server guards: `src/server/auth/guards.ts`.
- PostgreSQL user repository: `src/server/repositories/users/user.repository.ts`.
- PostgreSQL role-permission repository:
  `src/server/repositories/role-permissions/role-permission.repository.ts`.
- PostgreSQL identity Employee references:
  `src/server/repositories/application-employees/application-employee.repository.ts`.
- Current authenticated-user endpoint: `GET /api/me`.

Firebase Auth success alone does not grant application access. The server
denies access when the PostgreSQL user is missing, inactive/disabled, or an
Employee-role user has no explicit PostgreSQL Employee link. PostgreSQL
availability failures do not fall back to Firestore authorization.

Role permissions are read and updated in PostgreSQL. Updates use the seeded
permission catalog, optimistic assignment versions, the existing dependency
validation, and IT Administrator lockout protection. Role-permission changes
retain an actor snapshot and continue to use the existing audit event boundary
until the later audit repository migration.

## Controlled identity bootstrap

Use the CLI below after the PostgreSQL schema is deployed:

```text
yarn auth:bootstrap -- --dry-run
yarn auth:bootstrap -- --apply
```

Dry-run is the default when neither flag is supplied. The bootstrap reads
existing Firebase Auth users and their targeted Firestore application profiles;
it does not create Firebase users, copy passwords, scan business collections,
or migrate attendance, Payroll, Accounting, settings, or audit history. Only
referenced Employee rows needed for explicit identity links are synchronized.

The apply path refuses duplicate usernames, duplicate employee links,
unresolvable role/Employee references, and conflicting existing PostgreSQL
identity rows. It verifies an enabled Firebase identity maps to an active
PostgreSQL IT Administrator before it reports success.

The current environment returned `8 RESOURCE_EXHAUSTED: Quota exceeded` while
the bootstrap dry-run attempted the Firebase read. Therefore live identity
bootstrap and authenticated runtime verification remain pending until the
Firebase quota/access issue is resolved.

## Firestore coexistence and deprecated identity paths

Firestore remains in use for business repositories until the later repository
migration. The following identity paths are deprecated and must not be used as
authorization fallbacks:

- `users/{firebaseUid}` application profile reads/writes;
- `rolePermissions/{role}` role-permission reads/writes;
- Firestore employee lookup for the authenticated user's ownership context.

The existing Firestore user/account audit collections remain readable for
historical audit compatibility. Firebase Auth is retained unchanged, and no
Firebase users are deleted by the identity bridge.
