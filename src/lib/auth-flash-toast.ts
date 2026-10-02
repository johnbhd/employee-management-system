export type AuthRole = "employee" | "admin" | "hr" | "accounting";

export type AuthFlashPayload =
  | {
      type: "login-success";
      role: AuthRole;
    }
  | {
      type: "logout-success";
    };

export type AuthToastMessage = {
  type: AuthFlashPayload["type"];
  title: string;
  description: string;
};

export const AUTH_FLASH_STORAGE_KEY = "authFlashToast";

const authRoles: AuthRole[] = ["admin", "employee", "hr", "accounting"];

const loginToastMessages: Record<AuthRole, AuthToastMessage> = {
  admin: {
    type: "login-success",
    title: "Welcome back, IT Administrator.",
    description: "Integration monitoring and system administration tools are ready.",
  },
  employee: {
    type: "login-success",
    title: "Welcome back, Employee.",
    description: "Your attendance and employee self-service tools are ready.",
  },
  hr: {
    type: "login-success",
    title: "Welcome back, HR / Attendance Staff.",
    description: "Attendance review and verification tools are ready.",
  },
  accounting: {
    type: "login-success",
    title: "Welcome back, Accounting Staff.",
    description: "Your accounting integration workspace is ready.",
  },
};

const logoutToastMessage: AuthToastMessage = {
  type: "logout-success",
  title: "Logged out successfully.",
  description: "Your prototype session has been cleared.",
};

function getSessionStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function isAuthRole(value: unknown): value is AuthRole {
  if (typeof value !== "string") {
    return false;
  }

  return authRoles.includes(value as AuthRole);
}

export function setAuthFlashToast(payload: AuthFlashPayload) {
  const storage = getSessionStorage();

  if (!storage) {
    return;
  }

  try {
    storage.setItem(AUTH_FLASH_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Storage can be unavailable in a restricted browser context.
  }
}

export function consumeAuthFlashToast(): AuthToastMessage | null {
  const storage = getSessionStorage();

  if (!storage) {
    return null;
  }

  let rawPayload: string | null;

  try {
    rawPayload = storage.getItem(AUTH_FLASH_STORAGE_KEY);
    storage.removeItem(AUTH_FLASH_STORAGE_KEY);
  } catch {
    return null;
  }

  if (!rawPayload) {
    return null;
  }

  try {
    const payload = JSON.parse(rawPayload) as Partial<AuthFlashPayload> & {
      role?: unknown;
    };

    if (payload.type === "logout-success") {
      return logoutToastMessage;
    }

    if (payload.type === "login-success" && isAuthRole(payload.role)) {
      return loginToastMessages[payload.role];
    }
  } catch {
    return null;
  }

  return null;
}

export function logoutFromPrototype() {
  const storage = getSessionStorage();

  if (storage) {
    try {
      storage.removeItem("prototypeRole");
      storage.removeItem("prototypeUsername");
    } catch {
      // Continue to the flash message when storage is unavailable.
    }
  }

  setAuthFlashToast({ type: "logout-success" });
}
