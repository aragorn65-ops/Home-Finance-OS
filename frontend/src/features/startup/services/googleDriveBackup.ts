const googleClientId =
  import.meta.env
    .VITE_GOOGLE_CLIENT_ID as
    | string
    | undefined;

const googleIdentityScriptUrl =
  "https://accounts.google.com/gsi/client";

const googleDriveUploadUrl =
  "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink";

const googleDriveFileScope =
  "https://www.googleapis.com/auth/drive.file";

export interface GoogleDriveBackupUpload {
  filename: string;

  json: string;
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

interface GoogleTokenResponse {
  access_token?: string;

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

declare global {
  interface Window {
    google?: GoogleAccountsApi;
  }
}

export async function saveBackupToGoogleDrive({
  filename,
  json,
}: GoogleDriveBackupUpload): Promise<GoogleDriveBackupResult> {
  const clientId =
    googleClientId?.trim();

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

  return uploadBackupFileToDrive(
    tokenResult.accessToken,
    filename,
    json
  );
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
