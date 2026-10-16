import assert from "node:assert/strict";

import { normalizeAuditEventId } from "../../src/server/repositories/audit/audit-id.ts";

const validUuid = "4321496e-efe3-4b9a-9d71-3c587b76f6c8";

assert.equal(normalizeAuditEventId(validUuid), validUuid);
assert.equal(normalizeAuditEventId("correction:created"), undefined);
assert.equal(normalizeAuditEventId("attendance-record:final-verified"), undefined);
assert.equal(normalizeAuditEventId(undefined), undefined);

console.log("Audit event ID assertions passed.");
