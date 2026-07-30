import assert from "node:assert/strict";
import test from "node:test";

import {
  createGoogleDriveBackupStatus,
} from "../src/features/settings/services/googleDriveBackupStatus.ts";

test(
  "Google Drive backup status disables Drive actions when client id is missing",
  () => {
    const status =
      createGoogleDriveBackupStatus({
        isConfigured: false,
        isDataExportable: true,
        isBackupPasswordReady: true,
        isSavingCloudBackup: false,
        isLoadingDriveBackups: false,
        isDownloadingDriveBackup: false,
      });

    assert.equal(
      status.isSaveDisabled,
      true
    );
    assert.equal(
      status.isRestoreDisabled,
      true
    );
    assert.match(
      status.message,
      /not configured/
    );
    assert.match(
      status.message,
      /Local Export Backup and Import Backup still work/
    );
  }
);

test(
  "Google Drive backup status enables Drive actions after configuration and readiness",
  () => {
    const status =
      createGoogleDriveBackupStatus({
        isConfigured: true,
        isDataExportable: true,
        isBackupPasswordReady: true,
        isSavingCloudBackup: false,
        isLoadingDriveBackups: false,
        isDownloadingDriveBackup: false,
      });

    assert.equal(
      status.isSaveDisabled,
      false
    );
    assert.equal(
      status.isRestoreDisabled,
      false
    );
    assert.match(
      status.message,
      /configured/
    );
    assert.match(
      status.message,
      /Google permission/
    );
  }
);

test(
  "Google Drive backup status keeps actions disabled while local backup prerequisites are not ready",
  () => {
    const status =
      createGoogleDriveBackupStatus({
        isConfigured: true,
        isDataExportable: false,
        isBackupPasswordReady: false,
        isSavingCloudBackup: true,
        isLoadingDriveBackups: true,
        isDownloadingDriveBackup: false,
      });

    assert.equal(
      status.isSaveDisabled,
      true
    );
    assert.equal(
      status.isRestoreDisabled,
      true
    );
  }
);
