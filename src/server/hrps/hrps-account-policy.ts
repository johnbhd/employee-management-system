import { getFirebaseAuthPassword } from "@/lib/auth/firebase-credential-adapter";

export function normalizeDepartmentSlug(department: string): string {
  const normalized = department
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

  return normalized || "department";
}

export function getHrpsEmployeeUsername(department: string, employeeId: string): string {
  return `aujsc.${normalizeDepartmentSlug(department)}.${employeeId.trim().toLowerCase()}`;
}

export function getHrpsTemporaryPassword(employeeId: string): string {
  return getFirebaseAuthPassword(`aujsc.${employeeId.trim()}`);
}
