import {
  useState,
} from "react";
import {
  CloudDownload,
  CloudUpload,
} from "lucide-react";

import {
  loadHousehold,
} from "../../household/services/householdStorage";
import {
  useHouseholdMembership,
} from "../hooks";
import type {
  RemoteHouseholdCoreSnapshot,
} from "../models";
import {
  getLocalCoreSnapshotCounts,
  getAuthBackendAdapter,
  loadRemoteCoreSnapshotForHousehold,
  saveCurrentBrowserCoreSnapshotForHousehold,
} from "../services";
import {
  browserCoreSnapshotRecordSource,
} from "../services/browserCoreSnapshotRecordSource";

function getErrorMessage(
  error: unknown
): string {
  if (
    error instanceof Error &&
    error.message.trim()
  ) {
    return error.message;
  }

  return "Core snapshot action failed.";
}

export default function CoreSnapshotSyncPanel() {
  const household =
    loadHousehold();
  const localHouseholdId =
    household?.id ?? "";
  const cloudHouseholdId =
    household?.authenticatedLink
      ?.remoteHouseholdId ??
    localHouseholdId;
  const {
    membership,
    error: membershipError,
    isLoading: isMembershipLoading,
  } = useHouseholdMembership(
    cloudHouseholdId
  );

  const [
    snapshot,
    setSnapshot,
  ] = useState<
    RemoteHouseholdCoreSnapshot | undefined
  >();
  const [
    message,
    setMessage,
  ] = useState("");
  const [
    error,
    setError,
  ] = useState("");
  const [
    action,
    setAction,
  ] = useState<
    "save" | "load" | ""
  >("");

  const localCounts =
    getLocalCoreSnapshotCounts(
      localHouseholdId,
      browserCoreSnapshotRecordSource
    );
  const canUseCloudSnapshot =
    membership?.role === "owner" ||
    membership?.role === "admin";
  const isBusy =
    action !== "";
  const isDisabled =
    !household ||
    !cloudHouseholdId ||
    !canUseCloudSnapshot ||
    isMembershipLoading ||
    isBusy;

  const handleSave =
    async (): Promise<void> => {
      if (
        !household ||
        !cloudHouseholdId
      ) {
        return;
      }

      setAction("save");
      setMessage("");
      setError("");

      try {
        const saved =
          await saveCurrentBrowserCoreSnapshotForHousehold(
            {
              adapter:
                getAuthBackendAdapter(),
              householdId:
                cloudHouseholdId,
              localHouseholdId,
              recordSource:
                browserCoreSnapshotRecordSource,
            }
          );

        setSnapshot(saved);
        setMessage(
          `Saved ${saved.accounts.length} accounts and ${saved.transactions.length} transactions.`
        );
      } catch (error) {
        setError(
          getErrorMessage(error)
        );
      } finally {
        setAction("");
      }
    };

  const handleLoad =
    async (): Promise<void> => {
      if (!cloudHouseholdId) {
        return;
      }

      setAction("load");
      setMessage("");
      setError("");

      try {
        const loaded =
          await loadRemoteCoreSnapshotForHousehold(
            getAuthBackendAdapter(),
            cloudHouseholdId
          );

        setSnapshot(loaded);
        setMessage(
          `Loaded ${loaded.accounts.length} accounts and ${loaded.transactions.length} transactions.`
        );
      } catch (error) {
        setError(
          getErrorMessage(error)
        );
      } finally {
        setAction("");
      }
    };

  return (
    <section className="core-snapshot-panel">
      <div className="core-snapshot-panel__header">
        <div>
          <h3>
            Core Cloud Snapshot
          </h3>
        </div>
      </div>

      {membershipError && (
        <div
          role="alert"
          className="core-snapshot-panel__error"
        >
          {membershipError}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="core-snapshot-panel__error"
        >
          {error}
        </div>
      )}

      {message && (
        <div className="core-snapshot-panel__message">
          {message}
        </div>
      )}

      <dl className="core-snapshot-panel__grid">
        <div>
          <dt>Local Accounts</dt>
          <dd>
            {localCounts.accountCount}
          </dd>
        </div>

        <div>
          <dt>Local Transactions</dt>
          <dd>
            {localCounts.transactionCount}
          </dd>
        </div>

        <div>
          <dt>Cloud Accounts</dt>
          <dd>
            {snapshot
              ? snapshot.accounts.length
              : "not loaded"}
          </dd>
        </div>

        <div>
          <dt>Cloud Transactions</dt>
          <dd>
            {snapshot
              ? snapshot.transactions.length
              : "not loaded"}
          </dd>
        </div>

        <div>
          <dt>Saved</dt>
          <dd>
            {snapshot?.savedAt
              ? snapshot.savedAt.toLocaleString()
              : "not loaded"}
          </dd>
        </div>

        <div>
          <dt>Role</dt>
          <dd>
            {membership?.role ??
              (isMembershipLoading
                ? "loading"
                : "none")}
          </dd>
        </div>
      </dl>

      <div className="core-snapshot-panel__actions">
        <button
          type="button"
          onClick={() => {
            void handleSave();
          }}
          disabled={isDisabled}
          title="Save core snapshot"
        >
          <CloudUpload
            size={16}
            aria-hidden="true"
          />
          {action === "save"
            ? "Saving..."
            : "Save Snapshot"}
        </button>

        <button
          type="button"
          onClick={() => {
            void handleLoad();
          }}
          disabled={isDisabled}
          title="Load core snapshot"
        >
          <CloudDownload
            size={16}
            aria-hidden="true"
          />
          {action === "load"
            ? "Loading..."
            : "Load Snapshot"}
        </button>
      </div>
    </section>
  );
}
