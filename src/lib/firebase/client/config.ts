export type FirebaseClientConfig = {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
};

export class FirebaseClientConfigurationError extends Error {
    readonly code = "FIREBASE_CLIENT_CONFIGURATION_ERROR";

    constructor(missingVariables: string[]) {
        super(
            `Firebase client configuration is incomplete: ${missingVariables.join(
                ", ",
            )}.`,
        );
        this.name = "FirebaseClientConfigurationError";
    }
}

function normalizeEnvironmentValue(value: string | undefined): string {
    return value?.trim() ?? "";
}

export function getFirebaseClientConfig(): FirebaseClientConfig {
    const config = {
        apiKey: normalizeEnvironmentValue(
            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        ),
        authDomain: normalizeEnvironmentValue(
            process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        ),
        projectId: normalizeEnvironmentValue(
            process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        ),
        storageBucket: normalizeEnvironmentValue(
            process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        ),
        messagingSenderId: normalizeEnvironmentValue(
            process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        ),
        appId: normalizeEnvironmentValue(
            process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        ),
    };

    const requiredVariables: Array<[string, string]> = [
        ["NEXT_PUBLIC_FIREBASE_API_KEY", config.apiKey],
        ["NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", config.authDomain],
        ["NEXT_PUBLIC_FIREBASE_PROJECT_ID", config.projectId],
        ["NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", config.storageBucket],
        [
            "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
            config.messagingSenderId,
        ],
        ["NEXT_PUBLIC_FIREBASE_APP_ID", config.appId],
    ];

    const missingVariables = requiredVariables
        .filter(([, value]) => !value)
        .map(([variableName]) => variableName);

    if (missingVariables.length > 0) {
        throw new FirebaseClientConfigurationError(missingVariables);
    }

    return config;
}
