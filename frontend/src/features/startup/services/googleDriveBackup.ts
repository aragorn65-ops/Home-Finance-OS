const googleClientId =
  import.meta.env
    .VITE_GOOGLE_CLIENT_ID as
    | string
    | undefined;

const googleIdentityScriptUrl =
  "https://accounts.google.com/gsi/client";

const googleDriveUploadUrl =
  "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink";

const googleDriveFilesUrl =
  "https://www.googleapis.com/drive/v3/files";

const googleDriveFileScope =
  "https://www.googleapis.com/auth/drive.file";

let cachedGoogleDriveAccess:
  | {
      accessToken: string;
      expiresAt: number;
    }
  | undefined;

export interface GoogleDriveBackupUpload {
  filename: string;

  json: string;
}

export interface GoogleDriveBackupFile {
  id: string;

  name: string;

  createdTime?: string;

  modifiedTime?: string;

  size?: string;

  webViewLink?: string;
}

export type GoogleDriveBackupResult =
  | {
      success: true;
      message: string;
      fileId: string;
      filename: string;
      webViewLink?: string;
    }
  | {
      success: false;
      message: string;
    };

export type GoogleDriveBackupListResult =
  | {
      success: true;
      files: GoogleDriveBackupFile[];
      message: string;
    }
  | {
      success: false;
      message: string;
    };

export type GoogleDriveBackupDownloadResult =
  | {
      success: true;
      filename: string;
      json: string;
    }
  | {
      success: false;
      message: string;
    };

interface GoogleTokenResponse {
  access_token?: string;

  expires_in?: number;

  error?: string;

  error_description?: string;
}

interface GoogleTokenClient {
  requestAccessToken: (
    options?: {
      prompt?: string;
    }
  ) => void;
}

interface GoogleAccountsApi {
  accounts?: {
    oauth2?: {
      initTokenClient: (
        config: {
          client_id: string;
          scope: string;
          callback: (
            response: GoogleTokenResponse
          ) => void;
        }
      ) => GoogleTokenClient;
    };
  };
}

interface GoogleDriveFileResponse {
  id?: string;

  name?: string;

  webViewLink?: string;
}

interface GoogleDriveFilesListResponse {
  files?: unknown[];
}

declare global {
  interface Window {
    google?: GoogleAccountsApi;
  }
}

export function isGoogleDriveBackupConfigured(): boolean {
  return Boolean(
    googleClientId?.trim()
  );
}

export async function saveBackupToGoogleDrive({
  filename,
  json,
}: GoogleDriveBackupUpload): Promise<GoogleDriveBackupResult> {
  const accessResult =
    await requestGoogleDriveAccess();

  if (!accessResult.success) {
    return accessResult;
  }

  return uploadBackupFileToDrive(
    accessResult.accessToken,
    filename,
    json
  );
}

export async function listGoogleDriveBackups(): Promise<GoogleDriveBackupListResult> {
  const tokenResult =
    await requestGoogleDriveAccess();

  if (!tokenResult.success) {
    return tokenResult;
  }

  return listBackupFilesFromDrive(
    tokenResult.accessToken
  );
}

export async function downloadGoogleDriveBackup(
  file: GoogleDriveBackupFile
): Promise<GoogleDriveBackupDownloadResult> {
  const tokenResult =
    await requestGoogleDriveAccess();

  if (!tokenResult.success) {
    return tokenResult;
  }

  return downloadBackupFileFromDrive(
    tokenResult.accessToken,
    file
  );
}

async function requestGoogleDriveAccess(): Promise<
  | {
      success: true;
      accessToken: string;
    }
  | {
      success: false;
      message: string;
    }
> {
  const clientId =
    googleClientId?.trim();

  if (
    cachedGoogleDriveAccess &&
    cachedGoogleDriveAccess.expiresAt >
      Date.now()
  ) {
    return {
      success: true,
      accessToken:
        cachedGoogleDriveAccess.accessToken,
    };
  }

  if (!clientId) {
    return {
      success: false,
      message:
        "Google Drive backup needs VITE_GOOGLE_CLIENT_ID configured for this app.",
    };
  }

  const scriptResult =
    await loadGoogleIdentityScript();

  if (!scriptResult.success) {
    return scriptResult;
  }

  const tokenResult =
    await requestGoogleAccessToken(
      clientId
    );

  if (!tokenResult.success) {
    return tokenResult;
  }

  cachedGoogleDriveAccess = {
    accessToken:
      tokenResult.accessToken,
    expiresAt:
      Date.now() +
      tokenResult.expiresInMs,
  };

  return {
    success: true,
    accessToken:
      tokenResult.accessToken,
  };
}

async function loadGoogleIdentityScript(): Promise<
  | {
      success: true;
    }
  | {
      success: false;
      message: string;
    }
> {
  if (
    window.google?.accounts
      ?.oauth2
  ) {
    return {
      success: true,
    };
  }

  const existingScript =
    document.querySelector(
      `script[src="${googleIdentityScriptUrl}"]`
    );

  if (existingScript) {
    return waitForGoogleIdentity();
  }

  const script =
    document.createElement("script");

  script.src =
    googleIdentityScriptUrl;
  script.async = true;
  script.defer = true;

  const loadPromise =
    new Promise<
      | {
          success: true;
        }
      | {
          success: false;
          message: string;
        }
    >((resolve) => {
      script.onload = () => {
        resolve({
          success: true,
        });
      };

      script.onerror = () => {
        resolve({
          success: false,
          message:
            "Google sign-in could not be loaded. Check your connection and try again.",
        });
      };
    });

  document.head.appendChild(
    script
  );

  const result =
    await loadPromise;

  if (!result.success) {
    return result;
  }

  return waitForGoogleIdentity();
}

async function waitForGoogleIdentity(): Promise<
  | {
      success: true;
    }
  | {
      success: false;
      message: string;
    }
> {
  for (let index = 0; index < 20; index += 1) {
    if (
      window.google?.accounts
        ?.oauth2
    ) {
      return {
        success: true,
      };
    }

    await new Promise((resolve) =>
      window.setTimeout(
        resolve,
        50
      )
    );
  }

  return {
    success: false,
    message:
      "Google sign-in is unavailable in this browser session.",
  };
}

function requestGoogleAccessToken(
  clientId: string
): Promise<
  | {
      success: true;
      accessToken: string;
      expiresInMs: number;
    }
  | {
      success: false;
      message: string;
    }
> {
  const oauth =
    window.google?.accounts
      ?.oauth2;

  if (!oauth) {
    return Promise.resolve({
      success: false,
      message:
        "Google sign-in is unavailable in this browser session.",
    });
  }

  return new Promise((resolve) => {
    const tokenClient =
      oauth.initTokenClient({
        client_id:
          clientId,
        scope:
          googleDriveFileScope,
        callback: (response) => {
          if (
            response.error
          ) {
            resolve({
              success: false,
              message:
                response.error_description ??
                "Google Drive permission was not granted.",
            });

            return;
          }

          if (
            !response.access_token
          ) {
            resolve({
              success: false,
              message:
                "Google Drive did not return an access token.",
            });

            return;
          }

          resolve({
            success: true,
            accessToken:
              response.access_token,
            expiresInMs:
              getTokenExpiryMs(
                response
                  .expires_in
              ),
          });
        },
      });

    tokenClient.requestAccessToken({
      prompt: "consent",
    });
  });
}

async function uploadBackupFileToDrive(
  accessToken: string,
  filename: string,
  json: string
): Promise<GoogleDriveBackupResult> {
  const boundary =
    `hfos_backup_${crypto.randomUUID()}`;

  const metadata =
    JSON.stringify({
      name:
        filename,
      mimeType:
        "application/json",
    });

  const body = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    metadata,
    `--${boundary}`,
    "Content-Type: application/json",
    "",
    json,
    `--${boundary}--`,
    "",
  ].join("\r\n");

  let response: Response;

  try {
    response = await fetch(
      googleDriveUploadUrl,
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
          "Content-Type":
            `multipart/related; boundary=${boundary}`,
        },
        body,
      }
    );
  } catch {
    return {
      success: false,
      message:
        "Google Drive upload failed. Check your connection and try again.",
    };
  }

  if (!response.ok) {
    clearCachedAccessIfUnauthorized(
      response
    );

    return {
      success: false,
      message:
        "Google Drive rejected the backup upload.",
    };
  }

  const file =
    (await response.json()) as
      GoogleDriveFileResponse;

  if (!file.id) {
    return {
      success: false,
      message:
        "Google Drive upload finished without a file id.",
    };
  }

  return {
    success: true,
    fileId:
      file.id,
    filename:
      file.name ?? filename,
    webViewLink:
      file.webViewLink,
    message:
      `Backup saved to Google Drive as ${file.name ?? filename}.`,
  };
}

async function listBackupFilesFromDrive(
  accessToken: string
): Promise<GoogleDriveBackupListResult> {
  const query =
    [
      "trashed = false",
      "mimeType = 'application/json'",
      "name contains 'hfos-backup-'",
      "name contains '.hfos-backup.json'",
    ].join(" and ");

  const params =
    new URLSearchParams({
      q: query,
      spaces: "drive",
      pageSize: "10",
      orderBy:
        "createdTime desc",
      fields:
        "files(id,name,createdTime,modifiedTime,size,webViewLink)",
    });

  let response: Response;

  try {
    response = await fetch(
      `${googleDriveFilesUrl}?${params.toString()}`,
      {
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },
      }
    );
  } catch {
    return {
      success: false,
      message:
        "Google Drive backups could not be loaded. Check your connection and try again.",
    };
  }

  if (!response.ok) {
    clearCachedAccessIfUnauthorized(
      response
    );

    return {
      success: false,
      message:
        "Google Drive rejected the backup list request.",
    };
  }

  const result =
    (await response.json()) as
      GoogleDriveFilesListResponse;

  const files =
    Array.isArray(result.files)
      ? result.files.filter(
          isGoogleDriveBackupFile
        )
      : [];

  return {
    success: true,
    files,
    message:
      files.length > 0
        ? "Google Drive backups loaded."
        : "No HFOS backups were found in Google Drive for this app.",
  };
}

async function downloadBackupFileFromDrive(
  accessToken: string,
  file: GoogleDriveBackupFile
): Promise<GoogleDriveBackupDownloadResult> {
  let response: Response;

  const params =
    new URLSearchParams({
      alt: "media",
    });

  try {
    response = await fetch(
      `${googleDriveFilesUrl}/${encodeURIComponent(file.id)}?${params.toString()}`,
      {
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },
      }
    );
  } catch {
    return {
      success: false,
      message:
        "Google Drive backup could not be downloaded. Check your connection and try again.",
    };
  }

  if (!response.ok) {
    clearCachedAccessIfUnauthorized(
      response
    );

    return {
      success: false,
      message:
        "Google Drive rejected the backup download request.",
    };
  }

  return {
    success: true,
    filename:
      file.name,
    json:
      await response.text(),
  };
}

function isGoogleDriveBackupFile(
  value: unknown
): value is GoogleDriveBackupFile {
  if (
    typeof value !==
      "object" ||
    value === null
  ) {
    return false;
  }

  const file =
    value as Record<
      string,
      unknown
    >;

  return (
    typeof file.id ===
      "string" &&
    typeof file.name ===
      "string"
  );
}

function getTokenExpiryMs(
  expiresInSeconds: number | undefined
): number {
  if (
    typeof expiresInSeconds !==
      "number" ||
    !Number.isFinite(
      expiresInSeconds
    ) ||
    expiresInSeconds <= 60
  ) {
    return 50 * 60 * 1000;
  }

  return (
    expiresInSeconds - 60
  ) * 1000;
}

function clearCachedAccessIfUnauthorized(
  response: Response
): void {
  if (response.status === 401) {
    cachedGoogleDriveAccess =
      undefined;
  }
}
