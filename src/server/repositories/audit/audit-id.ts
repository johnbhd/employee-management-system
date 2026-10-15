const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizeAuditEventId(value: string | undefined): string | undefined {
    return value && uuidPattern.test(value) ? value : undefined;
}
