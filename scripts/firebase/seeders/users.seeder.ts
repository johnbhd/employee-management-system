import type { UserRecord } from "firebase-admin/auth";
import { FieldValue, type DocumentData } from "firebase-admin/firestore";

import { employeeSeedData } from "../data/employees";
import { userSeedData, type SeedUser } from "../data/users";
import { requireSeedServices } from "../seed-context";
import type {
  FirebaseSeeder,
  SeedRecord,
  SeedRecordStatus,
  SeederResult,
} from "../seed-types";

const userCollection = "users";

function isAuthUserNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "auth/user-not-found"
  );
}

function hasMatchingUserFields(
  existingData: DocumentData | undefined,
  expectedData: Record<string, unknown>,
): boolean {
  if (!existingData) {
    return false;
  }

  return Object.entries(expectedData).every(
    ([key, value]) => existingData[key] === value,
  );
}

function getPlannedRecord(user: SeedUser): SeedRecord {
  return {
    id: user.uid,
    label: user.username,
    status: "planned",
    detail: "Would reconcile the Auth user and Firestore user document.",
  };
}

async function findExistingAuthUser(
  auth: NonNullable<ReturnType<typeof requireSeedServices>>["auth"],
  user: SeedUser,
): Promise<{ record: UserRecord | null; emailMatchedDifferentUid: boolean }> {
  try {
    return {
      record: await auth.getUser(user.uid),
      emailMatchedDifferentUid: false,
    };
  } catch (error) {
    if (!isAuthUserNotFound(error)) {
      throw error;
    }
  }

  try {
    const record = await auth.getUserByEmail(user.authEmail);

    return {
      record,
      emailMatchedDifferentUid: record.uid !== user.uid,
    };
  } catch (error) {
    if (!isAuthUserNotFound(error)) {
      throw error;
    }

    return {
      record: null,
      emailMatchedDifferentUid: false,
    };
  }
}

async function reconcileAuthUser(
  auth: NonNullable<ReturnType<typeof requireSeedServices>>["auth"],
  user: SeedUser,
): Promise<{ uid: string; status: SeedRecordStatus; detail: string }> {
  const existing = await findExistingAuthUser(auth, user);

  if (!existing.record) {
    const record = await auth.createUser({
      uid: user.uid,
      email: user.authEmail,
      password: user.password,
      displayName: user.displayName,
      disabled: false,
    });

    return {
      uid: record.uid,
      status: "created",
      detail: "Created the deterministic Firebase Auth user.",
    };
  }

  const currentRecord = existing.record;
  const needsUpdate =
    currentRecord.email !== user.authEmail ||
    currentRecord.displayName !== user.displayName ||
    currentRecord.disabled;

  if (!needsUpdate) {
    return {
      uid: currentRecord.uid,
      status: "unchanged",
      detail: existing.emailMatchedDifferentUid
        ? "Reused the existing Auth user found by its seed email."
        : "Existing Firebase Auth user already matches the seed data.",
    };
  }

  const update: {
    displayName: string;
    disabled: boolean;
    email?: string;
  } = {
    displayName: user.displayName,
    disabled: false,
  };

  if (!existing.emailMatchedDifferentUid) {
    update.email = user.authEmail;
  }

  await auth.updateUser(currentRecord.uid, update);

  return {
    uid: currentRecord.uid,
    status: "updated",
    detail: existing.emailMatchedDifferentUid
      ? "Updated safe profile fields on the existing Auth user."
      : "Updated the safe seed-owned Auth profile fields.",
  };
}

function combineStatuses(
  authStatus: SeedRecordStatus,
  documentStatus: SeedRecordStatus,
): SeedRecordStatus {
  if (authStatus === "planned" || documentStatus === "planned") {
    return "planned";
  }

  if (authStatus === "created" || documentStatus === "created") {
    return "created";
  }

  if (authStatus === "updated" || documentStatus === "updated") {
    return "updated";
  }

  return "unchanged";
}

export const seedUsers: FirebaseSeeder = async (
  context,
): Promise<SeederResult> => {
  if (context.dryRun) {
    return {
      name: "users",
      records: userSeedData.map(getPlannedRecord),
    };
  }

  const { auth, db } = requireSeedServices(context);
  const knownEmployeeIds = new Set(
    employeeSeedData.map((employee) => employee.employeeId),
  );
  const records: SeedRecord[] = [];

  for (const user of userSeedData) {
    if (user.employeeId && !knownEmployeeIds.has(user.employeeId)) {
      throw new Error(
        `Seed user ${user.username} references an unknown employee ID.`,
      );
    }

    if (user.employeeId) {
      const employeeSnapshot = await db
        .collection("employees")
        .doc(user.employeeId)
        .get();

      if (!employeeSnapshot.exists) {
        throw new Error(
          `Seed user ${user.username} requires employee ${user.employeeId}, but that document does not exist.`,
        );
      }
    }

    const authResult = await reconcileAuthUser(auth, user);
    const userReference = db.collection(userCollection).doc(authResult.uid);
    const userSnapshot = await userReference.get();
    const existingData = userSnapshot.data();
    const userFields = {
      uid: authResult.uid,
      username: user.username,
      displayName: user.displayName,
      email: user.authEmail,
      role: user.role,
      employeeId: user.employeeId,
      status: "active" as const,
      dataSource: "development-seed" as const,
    };
    const needsCreatedAt = !existingData?.createdAt;
    const needsDocumentWrite =
      !userSnapshot.exists ||
      needsCreatedAt ||
      !hasMatchingUserFields(existingData, userFields);
    let documentStatus: SeedRecordStatus = "unchanged";

    if (needsDocumentWrite) {
      const writeData: DocumentData = {
        ...userFields,
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (needsCreatedAt) {
        writeData.createdAt = FieldValue.serverTimestamp();
      }

      await userReference.set(writeData, { merge: true });
      documentStatus = userSnapshot.exists ? "updated" : "created";
    }

    records.push({
      id: authResult.uid,
      label: user.username,
      status: combineStatuses(authResult.status, documentStatus),
      detail: `${authResult.detail} ${
        documentStatus === "created"
          ? "Created the Firestore user document."
          : documentStatus === "updated"
            ? "Updated the Firestore user document."
            : "Firestore user document is unchanged."
      }`,
    });
  }

  return {
    name: "users",
    records,
  };
};
