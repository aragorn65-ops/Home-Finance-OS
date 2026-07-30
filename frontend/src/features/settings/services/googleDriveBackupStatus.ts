export interface GoogleDriveBackupStatusInput {
  isConfigured: boolean;
  isDataExportable: boolean;
  isBackupPasswordReady: boolean;
  isSavingCloudBackup: boolean;
  isLoadingDriveBackups: boolean;
  isDownloadingDriveBackup: boolean;
}

export interface GoogleDriveBackupStatus {
  message: string;
  isSaveDisabled: boolean;
  isRestoreDisabled: boolean;
}

export function createGoogleDriveBackupStatus({
  isConfigured,
  isDataExportable,
  isBackupPasswordReady,
  isSavingCloudBackup,
  isLoadingDriveBackups,
  isDownloadingDriveBackup,
}: GoogleDriveBackupStatusInput): GoogleDriveBackupStatus {
  return {
    message:
      createGoogleDriveBackupStatusMessage(
        isConfigured
      ),
    isSaveDisabled:
      !isDataExportable ||
      !isBackupPasswordReady ||
      !isConfigured ||
      isSavingCloudBackup,
    isRestoreDisabled:
      !isConfigured ||
      isLoadingDriveBackups ||
      isDownloadingDriveBackup,
  };
}

export function createGoogleDriveBackupStatusMessage(
  isConfigured: boolean
): string {
  return isConfigured
    ? [
        "Google Drive backup is configured for this build.",
        "Save and restore actions are available after Google permission is granted.",
      ].join(" ")
    : [
        "Google Drive backup is not configured for this build.",
        "Add VITE_GOOGLE_CLIENT_ID to Cloudflare Pages, redeploy, then return here.",
        "Local Export Backup and Import Backup still work.",
      ].join(" ");
}
