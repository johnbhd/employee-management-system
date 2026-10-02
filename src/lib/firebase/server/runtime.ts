import {
  cert,
  getApp,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import {
  getAuth,
  type Auth,
} from "firebase-admin/auth";
import {
  getFirestore,
  type Firestore,
} from "firebase-admin/firestore";

import { getFirebaseAdminConfig } from "./config";

export { FirebaseAdminConfigurationError } from "./config";

export class FirebaseAdminInitializationError extends Error {
  readonly code = "FIREBASE_INITIALIZATION_ERROR";

  constructor() {
    super("Firebase Admin could not be initialized.");
    this.name = "FirebaseAdminInitializationError";
  }
}

let firebaseAdminApp: App | undefined;

export function getFirebaseAdminApp(): App {
  if (firebaseAdminApp) {
    return firebaseAdminApp;
  }

  const config = getFirebaseAdminConfig();

  try {
    const existingApps = getApps();

    if (existingApps.length > 0) {
      firebaseAdminApp = getApp();
    } else {
      firebaseAdminApp = initializeApp({
        credential: cert({
          projectId: config.projectId,
          clientEmail: config.clientEmail,
          privateKey: config.privateKey,
        }),
      });
    }
  } catch {
    throw new FirebaseAdminInitializationError();
  }

  return firebaseAdminApp;
}

export function getFirebaseAdminAuth(): Auth {
  return getAuth(getFirebaseAdminApp());
}

export function getFirebaseAdminDb(): Firestore {
  return getFirestore(getFirebaseAdminApp());
}
