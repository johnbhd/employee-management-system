import { getFirestore, type Firestore } from "firebase-admin/firestore";

import { getFirebaseAdminApp } from "./runtime";

/** Historical migration and development-seeding access only. */
export function getFirebaseAdminDb(): Firestore {
  return getFirestore(getFirebaseAdminApp());
}
