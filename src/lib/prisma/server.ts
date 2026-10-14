import "server-only";

import { Prisma, PrismaClient } from "@prisma/client";

type PrismaGlobal = typeof globalThis & {
  __employeeManagementPrisma?: PrismaClient;
};

const prismaGlobal = globalThis as PrismaGlobal;

export class PrismaConfigurationError extends Error {
  readonly code = "PRISMA_CONFIGURATION_ERROR";

  constructor(message: string) {
    super(message);
    this.name = "PrismaConfigurationError";
  }
}

export type PostgresHealth = {
  configured: boolean;
  connected: boolean;
};

function getDatabaseUrl(): string {
  const value = process.env.DATABASE_URL?.trim();

  if (!value) {
    throw new PrismaConfigurationError(
      "DATABASE_URL is not configured for the server.",
    );
  }

  try {
    const url = new URL(value);

    if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
      throw new Error("Unsupported database URL protocol.");
    }
  } catch {
    throw new PrismaConfigurationError(
      "DATABASE_URL must be a valid PostgreSQL connection string.",
    );
  }

  return value;
}

export function isPostgresConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function getPrismaClient(): PrismaClient {
  if (prismaGlobal.__employeeManagementPrisma) {
    return prismaGlobal.__employeeManagementPrisma;
  }

  const client = new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
  });

  prismaGlobal.__employeeManagementPrisma = client;

  return client;
}

export async function withTransaction<T>(
  callback: (transaction: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return getPrismaClient().$transaction(callback);
}

export async function checkPostgresHealth(): Promise<PostgresHealth> {
  if (!isPostgresConfigured()) {
    return {
      configured: false,
      connected: false,
    };
  }

  try {
    await getPrismaClient().$queryRaw<{ connected: number }[]>(
      Prisma.sql`SELECT 1 AS connected`,
    );

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
