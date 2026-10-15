import type { HrpsEmployeeInput, HrpsScheduleInput } from "../../types/hrps-import";

export class HrpsCsvError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "HrpsCsvError";
    this.code = code;
  }
}

export type ParsedCsv = {
  headers: string[];
  rows: string[][];
};

function pushField(row: string[], field: string) {
  row.push(field);
}

export function parseCsv(text: string, maxRows = 10000): ParsedCsv {
  const source = text.replace(/^\uFEFF/, "");

  if (!source.trim()) {
    throw new HrpsCsvError("EMPTY_FILE", "The uploaded CSV is empty.");
  }

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let fieldStarted = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];

    if (inQuotes) {
      if (character === '"') {
        if (source[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"') {
      if (fieldStarted || field.length > 0) {
        throw new HrpsCsvError("MALFORMED_CSV", "A quoted field started after other field content.");
      }
      inQuotes = true;
      fieldStarted = true;
      continue;
    }

    if (character === ",") {
      pushField(row, field);
      field = "";
      fieldStarted = false;
      continue;
    }

    if (character === "\n" || character === "\r") {
      pushField(row, field);
      field = "";
      fieldStarted = false;

      if (row.some((value) => value.trim())) {
        rows.push(row);
        if (rows.length > maxRows + 1) {
          throw new HrpsCsvError("TOO_MANY_ROWS", `The CSV cannot contain more than ${maxRows} data rows.`);
        }
      }
      row = [];
      if (character === "\r" && source[index + 1] === "\n") index += 1;
      continue;
    }

    field += character;
    fieldStarted = true;
  }

  if (inQuotes) {
    throw new HrpsCsvError("MALFORMED_CSV", "The CSV contains an unclosed quoted field.");
  }

  if (field.length > 0 || row.length > 0) {
    pushField(row, field);
    if (row.some((value) => value.trim())) rows.push(row);
  }

  if (rows.length === 0) {
    throw new HrpsCsvError("EMPTY_FILE", "The uploaded CSV has no header row.");
  }

  if (rows.length - 1 > maxRows) {
    throw new HrpsCsvError("TOO_MANY_ROWS", `The CSV cannot contain more than ${maxRows} data rows.`);
  }

  const headers = rows.shift()!.map((header) => header.trim());
  if (headers.some((header) => !header)) {
    throw new HrpsCsvError("INVALID_HEADERS", "CSV headers cannot be empty.");
  }

  const normalizedHeaders = headers.map((header) => normalizeHeader(header));
  if (new Set(normalizedHeaders).size !== normalizedHeaders.length) {
    throw new HrpsCsvError("DUPLICATE_HEADERS", "The CSV contains duplicate headers.");
  }

  return { headers, rows };
}

export function normalizeHeader(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export type HrpsCanonicalField =
  | "employeeId"
  | "employeeNumber"
  | "firstName"
  | "middleName"
  | "lastName"
  | "suffix"
  | "fullName"
  | "workEmail"
  | "department"
  | "officeUnit"
  | "position"
  | "employeeCategory"
  | "employmentType"
  | "employmentStatus"
  | "dateHired"
  | "assignedOffice"
  | "workLocation"
  | "workDays"
  | "shiftLabel"
  | "workStart"
  | "workEnd"
  | "breakStart"
  | "breakEnd"
  | "restDays"
  | "effectiveFrom"
  | "effectiveTo"
  | "sourceApplicationRole"
  | "recordStatus"
  | "sourceUpdatedAt"
  | "scheduleId";

/**
 * Source headers are kept separate from the internal Employee and schedule
 * DTO names. This prevents implementation-only fields such as displayName
 * from becoming required HRPS headers.
 */
export const hrpsHeaderAliases: Record<string, HrpsCanonicalField> = {
  employeeid: "employeeId",
  employeeidentifier: "employeeId",
  employeenumber: "employeeNumber",
  firstname: "firstName",
  middlename: "middleName",
  lastname: "lastName",
  suffix: "suffix",
  fullname: "fullName",
  name: "fullName",
  displayname: "fullName",
  employeename: "fullName",
  workemail: "workEmail",
  email: "workEmail",
  department: "department",
  dept: "department",
  officeunit: "officeUnit",
  position: "position",
  jobtitle: "position",
  employeecategory: "employeeCategory",
  employmenttype: "employmentType",
  employmentstatus: "employmentStatus",
  status: "employmentStatus",
  datehired: "dateHired",
  assignedoffice: "assignedOffice",
  worklocation: "workLocation",
  workdays: "workDays",
  restday: "restDays",
  restdays: "restDays",
  shift: "shiftLabel",
  shiftlabel: "shiftLabel",
  workstarttime: "workStart",
  workstart: "workStart",
  starttime: "workStart",
  workendtime: "workEnd",
  workend: "workEnd",
  endtime: "workEnd",
  breakstarttime: "breakStart",
  breakstart: "breakStart",
  breakendtime: "breakEnd",
  breakend: "breakEnd",
  scheduleeffectivefrom: "effectiveFrom",
  effectivefrom: "effectiveFrom",
  scheduleeffectiveto: "effectiveTo",
  effectiveto: "effectiveTo",
  scheduleid: "scheduleId",
  siaapplicationrole: "sourceApplicationRole",
  recordstatus: "recordStatus",
  sourceupdatedat: "sourceUpdatedAt",
};

const requiredSourceFields = ["employeeId", "department", "employmentStatus"] as const;
const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const weekdayAliases: Record<string, string> = {
  mon: "Monday",
  monday: "Monday",
  tue: "Tuesday",
  tues: "Tuesday",
  tuesday: "Tuesday",
  wed: "Wednesday",
  wednesday: "Wednesday",
  thu: "Thursday",
  thurs: "Thursday",
  thursday: "Thursday",
  fri: "Friday",
  friday: "Friday",
  sat: "Saturday",
  saturday: "Saturday",
  sun: "Sunday",
  sunday: "Sunday",
};

export type HrpsCanonicalHeaders = {
  columns: Map<HrpsCanonicalField, number>;
  headerCount: number;
  supported: string[];
  ignored: string[];
};

export type ParsedHrpsRow = {
  rowNumber: number;
  employeeId: string | null;
  input: HrpsEmployeeInput | null;
  errors: string[];
  warnings: string[];
};

export function canonicalizeHrpsHeaders(headers: string[]): HrpsCanonicalHeaders {
  const columns = new Map<HrpsCanonicalField, number>();
  const supported: string[] = [];
  const ignored: string[] = [];

  headers.forEach((header, index) => {
    const canonical = hrpsHeaderAliases[normalizeHeader(header)];
    if (!canonical) {
      ignored.push(header);
      return;
    }
    if (columns.has(canonical)) {
      throw new HrpsCsvError("DUPLICATE_HEADERS", `The CSV maps more than one header to ${canonical}.`);
    }
    columns.set(canonical, index);
    supported.push(header);
  });

  const missing = requiredSourceFields.filter((field) => !columns.has(field));
  if (missing.length) {
    throw new HrpsCsvError("MISSING_REQUIRED_HEADERS", `Missing required CSV columns: ${missing.join(", ")}.`);
  }

  return { columns, headerCount: headers.length, supported, ignored };
}

function cleanValue(value: string | undefined, maxLength: number): string {
  const result = value?.trim() ?? "";
  if (result.length > maxLength || result.includes("\u0000")) return "";
  return result;
}

function valueAt(row: string[], columns: Map<HrpsCanonicalField, number>, key: HrpsCanonicalField): string {
  const index = columns.get(key);
  return index === undefined ? "" : row[index] ?? "";
}

function parseEmploymentStatus(value: string): "active" | "inactive" | null {
  const normalized = value.trim().toLowerCase();
  return normalized === "active" || normalized === "inactive" ? normalized : null;
}

function parseDate(value: string, field: string, errors: string[]): string | null {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    errors.push(`${field} must use YYYY-MM-DD format.`);
    return null;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    errors.push(`${field} is not a valid calendar date.`);
    return null;
  }
  return value;
}

function parseTime(value: string, field: string, errors: string[], required: boolean): string | null {
  if (!value) {
    if (required) errors.push(`${field} is required when a schedule is supplied.`);
    return null;
  }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    errors.push(`${field} must use HH:mm format.`);
    return null;
  }
  return value;
}

function parseDays(value: string, field: string, errors: string[]): string[] {
  if (!value) {
    errors.push(`${field} is required when a schedule is supplied.`);
    return [];
  }
  const sourceValues = value.split(/[;,|]/).filter((item) => item.trim());
  const values = sourceValues.map((item) => weekdayAliases[item.trim().toLowerCase()]).filter(Boolean);
  if (!values.length || values.length !== sourceValues.length) {
    errors.push(`${field} contains an unsupported weekday.`);
    return [];
  }
  return [...new Set(values)];
}

function parseSchedule(
  row: string[],
  columns: Map<HrpsCanonicalField, number>,
  errors: string[],
  employeeId: string | null,
): HrpsScheduleInput | null {
  const rawKeys: HrpsCanonicalField[] = [
    "scheduleId",
    "workDays",
    "restDays",
    "workStart",
    "workEnd",
    "breakStart",
    "breakEnd",
    "shiftLabel",
    "workLocation",
    "effectiveFrom",
    "effectiveTo",
  ];
  const hasSchedule = rawKeys.some((key) => valueAt(row, columns, key).trim());
  if (!hasSchedule) return null;

  const suppliedScheduleId = cleanValue(valueAt(row, columns, "scheduleId"), 120);
  const scheduleId = suppliedScheduleId || (employeeId ? `hrps:${employeeId}` : "");
  if (!scheduleId) errors.push("A schedule identifier could not be derived because Employee ID is missing.");

  const workDays = parseDays(cleanValue(valueAt(row, columns, "workDays"), 200), "work_days", errors);
  const suppliedRestDays = cleanValue(valueAt(row, columns, "restDays"), 200);
  const restDays = suppliedRestDays
    ? parseDays(suppliedRestDays, "rest_day", errors)
    : weekdays.filter((day) => !workDays.includes(day));
  const workStart = parseTime(cleanValue(valueAt(row, columns, "workStart"), 5), "work_start_time", errors, true);
  const workEnd = parseTime(cleanValue(valueAt(row, columns, "workEnd"), 5), "work_end_time", errors, true);
  const breakStart = parseTime(cleanValue(valueAt(row, columns, "breakStart"), 5), "break_start_time", errors, false);
  const breakEnd = parseTime(cleanValue(valueAt(row, columns, "breakEnd"), 5), "break_end_time", errors, false);

  if ((breakStart && !breakEnd) || (!breakStart && breakEnd)) {
    errors.push("break_start_time and break_end_time must be supplied together.");
  }
  if (workStart && workEnd && workEnd <= workStart) {
    errors.push("work_end_time must be later than work_start_time.");
  }

  const effectiveFrom = parseDate(cleanValue(valueAt(row, columns, "effectiveFrom"), 10), "schedule_effective_from", errors);
  const effectiveTo = parseDate(cleanValue(valueAt(row, columns, "effectiveTo"), 10), "schedule_effective_to", errors);
  if (effectiveFrom && effectiveTo && effectiveTo < effectiveFrom) {
    errors.push("schedule_effective_to cannot be earlier than schedule_effective_from.");
  }

  return {
    scheduleId,
    workStart: workStart ?? "",
    workEnd: workEnd ?? "",
    breakStart,
    breakEnd,
    shiftLabel: cleanValue(valueAt(row, columns, "shiftLabel"), 120) || null,
    workDays,
    restDays,
    workLocation: cleanValue(valueAt(row, columns, "workLocation"), 200) || null,
    effectiveFrom,
    effectiveTo,
  };
}

function resolveDisplayName(row: string[], columns: Map<HrpsCanonicalField, number>, errors: string[]): string {
  const fullName = cleanValue(valueAt(row, columns, "fullName"), 160);
  if (fullName) return fullName;

  const firstName = cleanValue(valueAt(row, columns, "firstName"), 80);
  const middleName = cleanValue(valueAt(row, columns, "middleName"), 80);
  const lastName = cleanValue(valueAt(row, columns, "lastName"), 80);
  const suffix = cleanValue(valueAt(row, columns, "suffix"), 40);
  if (!firstName || !lastName) {
    errors.push("Name is required: provide full_name or both first_name and last_name.");
    return "";
  }
  return cleanValue([firstName, middleName, lastName, suffix].filter(Boolean).join(" "), 160);
}

export function parseHrpsRows(canonical: HrpsCanonicalHeaders, rows: string[][]): ParsedHrpsRow[] {
  return rows.map((row, index) => {
    const rowNumber = index + 2;
    const errors: string[] = [];
    const warnings: string[] = [];
    if (row.length > canonical.headerCount) {
      errors.push("The row contains more values than the header row.");
    }

    const employeeId = cleanValue(valueAt(row, canonical.columns, "employeeId"), 64) || null;
    if (!employeeId) {
      errors.push("Employee ID is required.");
    } else if (!/^[A-Za-z0-9][A-Za-z0-9._/-]{0,63}$/.test(employeeId)) {
      errors.push("Employee ID contains unsupported characters.");
    }

    const displayName = resolveDisplayName(row, canonical.columns, errors);
    const department = cleanValue(valueAt(row, canonical.columns, "department"), 160);
    const position = cleanValue(valueAt(row, canonical.columns, "position"), 160) || null;
    const employmentStatusValue = cleanValue(valueAt(row, canonical.columns, "employmentStatus"), 40);
    const employmentStatus = parseEmploymentStatus(employmentStatusValue);
    if (!department) errors.push("Department is required.");
    if (!employmentStatus) errors.push("Employment status must be active or inactive.");

    const schedule = parseSchedule(row, canonical.columns, errors, employeeId);
    const sourceApplicationRole = cleanValue(valueAt(row, canonical.columns, "sourceApplicationRole"), 120);
    if (sourceApplicationRole) {
      warnings.push("sia_application_role is informational only and does not grant application access.");
    }
    const input: HrpsEmployeeInput = {
      employeeId: employeeId ?? "",
      displayName,
      department,
      position,
      employmentStatus: employmentStatus ?? "inactive",
      schedule,
    };

    if (!schedule) warnings.push("No schedule fields were supplied; existing schedule history will remain unchanged.");

    return { rowNumber, employeeId, input, errors, warnings };
  });
}
