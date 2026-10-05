const firebaseMinimumPasswordLength = 6;

const authEmailByUsername: Readonly<Record<string, string>> = {
    "aujsc.admin": "aujsc.admin@auth.aujsc.local",
    "aujsc.hr": "aujsc.hr@auth.aujsc.local",
    "aujsc.employee": "aujsc.employee@auth.aujsc.local",
    "aujsc.accounting": "aujsc.accounting@auth.aujsc.local",
    "aujsc.registrar.001": "aujsc.registrar.001@auth.aujsc.local",
    "aujsc.admissions.002": "aujsc.admissions.002@auth.aujsc.local",
    "aujsc.library.003": "aujsc.library.003@auth.aujsc.local",
    "aujsc.cashier.004": "aujsc.cashier.004@auth.aujsc.local",
    "aujsc.records.005": "aujsc.records.005@auth.aujsc.local",
    "aujsc.guidance.006": "aujsc.guidance.006@auth.aujsc.local",
    "aujsc.studentaffairs.007": "aujsc.studentaffairs.007@auth.aujsc.local",
    "aujsc.itoffice.008": "aujsc.itoffice.008@auth.aujsc.local",
    "aujsc.adminoffice.009": "aujsc.adminoffice.009@auth.aujsc.local",
    "aujsc.facilities.010": "aujsc.facilities.010@auth.aujsc.local",
};

export function normalizeAuthUsername(username: string): string {
    return username.trim().toLowerCase();
}

export function getFirebaseAuthEmail(username: string): string | null {
    const normalizedUsername = normalizeAuthUsername(username);

    return authEmailByUsername[normalizedUsername] ?? null;
}

export function getRequiredFirebaseAuthEmail(username: string): string {
    const authEmail = getFirebaseAuthEmail(username);

    if (!authEmail) {
        throw new Error(
            `No Firebase Auth identity is mapped for username ${username}.`,
        );
    }

    return authEmail;
}

export function getFirebaseAuthPassword(password: string): string {
    return password.padEnd(firebaseMinimumPasswordLength, "4");
}
