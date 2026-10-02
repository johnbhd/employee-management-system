export type FirebaseAdminConfig = {
    projectId: string;
    clientEmail: string;
    privateKey: string;
};

export class FirebaseAdminConfigurationError extends Error {
    readonly code = "FIREBASE_CONFIGURATION_ERROR";

    constructor(message: string) {
        super(message);
        this.name = "FirebaseAdminConfigurationError";
    }
}

function getRequiredServerValue(
    variableName: string,
    value: string | undefined,
): string {
    const normalizedValue = value?.trim() ?? "";

    if (!normalizedValue) {
        throw new FirebaseAdminConfigurationError(
            `Firebase Admin configuration is incomplete: ${variableName} is missing.`,
        );
    }

    return normalizedValue;
}

export function getFirebaseAdminConfig(): FirebaseAdminConfig {
    const projectId = getRequiredServerValue(
        "FIREBASE_PROJECT_ID",
        process.env.FIREBASE_PROJECT_ID,
    );
    const clientEmail = getRequiredServerValue(
        "FIREBASE_CLIENT_EMAIL",
        process.env.FIREBASE_CLIENT_EMAIL,
    );
    const privateKey = getRequiredServerValue(
        "FIREBASE_PRIVATE_KEY",
        process.env.FIREBASE_PRIVATE_KEY,
    ).replace(/\\n/g, "\n");
    const publicProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();

    if (publicProjectId && publicProjectId !== projectId) {
        throw new FirebaseAdminConfigurationError(
            "Firebase client and Admin project IDs do not match.",
        );
    }

    return {
        projectId,
        clientEmail,
        privateKey,
    };
}
