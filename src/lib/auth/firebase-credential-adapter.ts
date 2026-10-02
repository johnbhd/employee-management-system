const firebaseMinimumPasswordLength = 6;

const authEmailByUsername: Readonly<Record<string, string>> = {
    "aujsc.admin": "aujsc.admin@auth.aujsc.local",
    "aujsc.hr": "aujsc.hr@auth.aujsc.local",
    "aujsc.employee": "aujsc.employee@auth.aujsc.local",
    "aujsc.accounting": "aujsc.accounting@auth.aujsc.local",
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
    if (password.length >= firebaseMinimumPasswordLength) {
        return password;
    }

    return `${password}4`;
}
