import "server-only";

import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";

const connectionTimeoutMillis = 5_000;
const queryTimeoutMillis = 10_000;

type PostgresGlobal = typeof globalThis & {
  __employeeManagementPostgresPool?: Pool;
};

const postgresGlobal = globalThis as PostgresGlobal;

export class PostgresConfigurationError extends Error {
  readonly code = "POSTGRES_CONFIGURATION_ERROR";

  constructor(message: string) {
    super(message);
    this.name = "PostgresConfigurationError";
  }
}

export class PostgresConnectionError extends Error {
  readonly code = "POSTGRES_CONNECTION_ERROR";

  constructor(message = "PostgreSQL is unavailable.") {
    super(message);
    this.name = "PostgresConnectionError";
  }
}

export type PostgresHealth = {
  configured: boolean;
  connected: boolean;
};

function getErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return null;
  }

  const code = (error as { code?: unknown }).code;

  return typeof code === "string" && /^[A-Z0-9_]+$/.test(code)
    ? code
    : null;
}

function normalizeConnectionError(
  error: unknown,
): PostgresConfigurationError | PostgresConnectionError {
  if (
    error instanceof PostgresConfigurationError
    || error instanceof PostgresConnectionError
  ) {
    return error;
  }

  const code = getErrorCode(error);

  return new PostgresConnectionError(
    code ? `PostgreSQL is unavailable (${code}).` : undefined,
  );
}

function getDatabaseUrl(): string {
  const value = process.env.DATABASE_URL?.trim();

  if (!value) {
    throw new PostgresConfigurationError(
      "DATABASE_URL is not configured for the server.",
    );
  }

  try {
    const url = new URL(value);

    if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
      throw new Error("Unsupported database URL protocol.");
    }
  } catch {
    throw new PostgresConfigurationError(
      "DATABASE_URL must be a valid PostgreSQL connection string.",
    );
  }

  return value;
}

export function isPostgresConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function getPostgresPool(): Pool {
  if (postgresGlobal.__employeeManagementPostgresPool) {
    return postgresGlobal.__employeeManagementPostgresPool;
  }

  const pool = new Pool({
    connectionString: getDatabaseUrl(),
    connectionTimeoutMillis,
    idleTimeoutMillis: 10_000,
    max: 5,
    query_timeout: queryTimeoutMillis,
    statement_timeout: queryTimeoutMillis,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  pool.on("error", (error: unknown) => {
    const code = getErrorCode(error);

    console.error(
      code
        ? `Unexpected idle PostgreSQL client error (${code}).`
        : "Unexpected idle PostgreSQL client error.",
    );
  });

  postgresGlobal.__employeeManagementPostgresPool = pool;

  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values: unknown[] = [],
): Promise<QueryResult<T>> {
  try {
    return await getPostgresPool().query<T>(text, values);
  } catch (error) {
    throw normalizeConnectionError(error);
  }
}

export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getPostgresPool().connect().catch((error: unknown) => {
    throw normalizeConnectionError(error);
  });

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");

    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Preserve the original failure while still attempting rollback.
    }

    throw normalizeConnectionError(error);
  } finally {
    client.release();
  }
}

export async function checkPostgresHealth(): Promise<PostgresHealth> {
  if (!isPostgresConfigured()) {
    return {
      configured: false,
      connected: false,
    };
  }

  try {
    await query<{ connected: number }>("SELECT 1 AS connected");

    return {
      configured: true,
      connected: true,
    };
  } catch {
    return {
      configured: true,
      connected: false,
    };
  }
}
