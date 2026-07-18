export const APP_LOCK_STORAGE_KEY =
  "hfos.v1.app-lock";

interface StoredAppLockSettings {
  enabled: true;
  pinHash: string;
  salt: string;
  idleTimeoutMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface AppLockResult {
  success: boolean;
  message: string;
}

export function isAppLockEnabled():
  boolean {
  return getAppLockSettings() !== null;
}

export function getAppLockIdleTimeoutMinutes():
  number {
  return (
    getAppLockSettings()
      ?.idleTimeoutMinutes ?? 0
  );
}

export async function enableAppLock(
  pin: string,
  idleTimeoutMinutes = 0
): Promise<AppLockResult> {
  const normalizedPin =
    pin.trim();

  if (!isValidPin(normalizedPin)) {
    return {
      success: false,
      message:
        "Enter a PIN with 4 to 8 digits.",
    };
  }

  const salt =
    createSalt();

  const pinHash =
    await hashPin(
      normalizedPin,
      salt
    );

  if (!pinHash) {
    return {
      success: false,
      message:
        "This browser cannot create a secure app lock.",
    };
  }

  const now =
    new Date().toISOString();

  const settings: StoredAppLockSettings = {
    enabled: true,
    pinHash,
    salt,
    idleTimeoutMinutes:
      normalizeIdleTimeoutMinutes(
        idleTimeoutMinutes
      ),
    createdAt: now,
    updatedAt: now,
  };

  return saveAppLockSettings(
    settings
  );
}

export function updateAppLockIdleTimeout(
  idleTimeoutMinutes: number
): AppLockResult {
  const settings =
    getAppLockSettings();

  if (!settings) {
    return {
      success: false,
      message:
        "Enable app lock before setting an inactivity timer.",
    };
  }

  return saveAppLockSettings({
    ...settings,
    idleTimeoutMinutes:
      normalizeIdleTimeoutMinutes(
        idleTimeoutMinutes
      ),
    updatedAt:
      new Date().toISOString(),
  });
}

export async function verifyAppLockPin(
  pin: string
): Promise<boolean> {
  const settings =
    getAppLockSettings();

  if (!settings) {
    return true;
  }

  const pinHash =
    await hashPin(
      pin.trim(),
      settings.salt
    );

  return (
    pinHash !== null &&
    pinHash === settings.pinHash
  );
}

export async function disableAppLock(
  pin: string
): Promise<AppLockResult> {
  const isVerified =
    await verifyAppLockPin(pin);

  if (!isVerified) {
    return {
      success: false,
      message:
        "The current PIN was not correct.",
    };
  }

  const storage =
    getStorage();

  if (!storage) {
    return {
      success: false,
      message:
        "Browser local storage is unavailable.",
    };
  }

  try {
    storage.removeItem(
      APP_LOCK_STORAGE_KEY
    );

    return {
      success: true,
      message:
        "App lock disabled.",
    };
  } catch {
    return {
      success: false,
      message:
        "App lock could not be disabled.",
    };
  }
}

function getAppLockSettings():
  StoredAppLockSettings | null {
  const storage =
    getStorage();

  if (!storage) {
    return null;
  }

  const json =
    storage.getItem(
      APP_LOCK_STORAGE_KEY
    );

  if (!json) {
    return null;
  }

  try {
    const parsed =
      JSON.parse(json);

    if (
      isStoredAppLockSettings(parsed)
    ) {
      return {
        ...parsed,
        idleTimeoutMinutes:
          normalizeIdleTimeoutMinutes(
            parsed.idleTimeoutMinutes ?? 0
          ),
      };
    }
  } catch {
    return null;
  }

  return null;
}

function saveAppLockSettings(
  settings: StoredAppLockSettings
): AppLockResult {
  const storage =
    getStorage();

  if (!storage) {
    return {
      success: false,
      message:
        "Browser local storage is unavailable.",
    };
  }

  try {
    storage.setItem(
      APP_LOCK_STORAGE_KEY,
      JSON.stringify(settings)
    );

    return {
      success: true,
      message:
        "App lock enabled. HFOS will ask for this PIN after refresh or manual lock.",
    };
  } catch {
    return {
      success: false,
      message:
        "App lock could not be saved.",
    };
  }
}

function isValidPin(pin: string):
  boolean {
  return /^\d{4,8}$/.test(pin);
}

function createSalt(): string {
  const browserCrypto =
    getBrowserCrypto();

  if (!browserCrypto) {
    return "";
  }

  const bytes =
    new Uint8Array(16);

  browserCrypto.getRandomValues(
    bytes
  );

  return bytesToBase64(bytes);
}

async function hashPin(
  pin: string,
  salt: string
): Promise<string | null> {
  const browserCrypto =
    getBrowserCrypto();

  if (
    !browserCrypto?.subtle ||
    typeof TextEncoder ===
      "undefined"
  ) {
    return null;
  }

  const encoded =
    new TextEncoder().encode(
      `${salt}:${pin}`
    );

  const digest =
    await browserCrypto.subtle.digest(
      "SHA-256",
      encoded
    );

  return bytesToBase64(
    new Uint8Array(digest)
  );
}

function bytesToBase64(
  bytes: Uint8Array
): string {
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(
      byte
    );
  });

  return btoa(binary);
}

function isStoredAppLockSettings(
  value: unknown
): value is StoredAppLockSettings {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const record =
    value as Record<string, unknown>;

  return (
    record.enabled === true &&
    typeof record.pinHash ===
      "string" &&
    typeof record.salt === "string" &&
    (typeof record.idleTimeoutMinutes ===
      "number" ||
      record.idleTimeoutMinutes ===
        undefined) &&
    typeof record.createdAt ===
      "string" &&
    typeof record.updatedAt ===
      "string"
  );
}

function normalizeIdleTimeoutMinutes(
  value: number
): number {
  const supportedValues =
    new Set([
      0,
      1,
      5,
      15,
      30,
    ]);

  return supportedValues.has(value)
    ? value
    : 0;
}

function getStorage():
  Storage | null {
  if (
    typeof window ===
    "undefined"
  ) {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function getBrowserCrypto():
  Crypto | null {
  if (
    typeof globalThis ===
      "undefined" ||
    !globalThis.crypto
  ) {
    return null;
  }

  return globalThis.crypto;
}
