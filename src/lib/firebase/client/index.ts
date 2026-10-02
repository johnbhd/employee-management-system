import {
    getApp,
    getApps,
    initializeApp,
    type FirebaseApp,
} from "firebase/app";
import {
    getAuth,
    type Auth,
} from "firebase/auth";
import {
    getFirestore,
    type Firestore,
} from "firebase/firestore";

import { getFirebaseClientConfig } from "./config";

let firebaseApp: FirebaseApp | undefined;

export function getFirebaseApp(): FirebaseApp {
    if (firebaseApp) {
        return firebaseApp;
    }

    const config = getFirebaseClientConfig();

    const existingApps = getApps();

    if (existingApps.length > 0) {
        firebaseApp = getApp();
    } else {
        firebaseApp = initializeApp(config);
    }

    return firebaseApp;
}

export function getFirebaseAuth(): Auth {
    return getAuth(getFirebaseApp());
}

export function getFirebaseDb(): Firestore {
    return getFirestore(getFirebaseApp());
}
