import "./MigrationCheckpointPanel.css";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  CheckCircle2,
  CloudUpload,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import type {
  RemoteMigrationDraft,
} from "../models";
import {
  linkHouseholdToAuthenticatedTenant,
  loadHousehold,
} from "../../household/services/householdStorage";
import {
  getApplicationDataHealthSummary,
} from "../../startup/services/applicationBackup";
import {
  getAuthBackendAdapter,
} from "../services/createAuthBackendAdapter";
import {
  getMigrationCheckpointLifecycleEntries,
  sortMigrationCheckpointDrafts,
} from "./migrationCheckpointLifecycle";
import {
  assertMigrationCommitResultMatchesDraft,
  requireMigrationCommitLocalLink,
  requireMigrationCommitLocalOwner,
  requireMigrationCommitDraft,
  requireMigrationCommitUploadStaged,
} from "./migrationCheckpointCommit";
import {
  requireMigrationAbortDraft,
  requireMigrationUploadStagingDraft,
  requireMigrationValidateDraft,
} from "./migrationCheckpointActionGuards";
import {
  createMigrationUploadManifest,
  createMigrationUploadDryRunContract,
} from "./migrationUploadDryRun";

export interface MigrationCheckpointPanelProps {
  refreshToken?: number;
  onStatusChange?: () => void;
}

export default function MigrationCheckpointPanel({
  refreshToken = 0,
  onStatusChange,
}: MigrationCheckpointPanelProps) {
  const [
    drafts,
    setDrafts,
  ] = useState<RemoteMigrationDraft[]>([]);
  const [
    isLoading,
    setIsLoading,
  ] = useState(false);
  const [
    actionDraftId,
    setActionDraftId,
  ] = useState("");
  const [
    error,
    setError,
  ] = useState("");
  const [
    message,
    setMessage,
  ] = useState("");

  const loadDrafts =
    useCallback(async () => {
      setError("");

      try {
        setDrafts(
          sortMigrationCheckpointDrafts(
            await getAuthBackendAdapter()
              .listMigrationDrafts()
          )
        );
      } catch {
        setDrafts([]);
        setError(
          "Migration checkpoints could not be loaded."
        );
      }
    }, []);

  useEffect(() => {
    void loadDrafts();
  }, [
    loadDrafts,
    refreshToken,
  ]);

  const runAction =
    useCallback(
      async (
        draftId: string,
        action:
          | "validate"
          | "stage-upload"
          | "commit"
          | "abort"
      ) => {
        setError("");
        setMessage("");
        setIsLoading(true);
        setActionDraftId(draftId);

        try {
          const adapter =
            getAuthBackendAdapter();

          if (action === "validate") {
            const draft =
              requireMigrationValidateDraft(
              drafts,
              draftId
            );
            const dryRunContract =
              createMigrationUploadDryRunContract(
                draft,
                getApplicationDataHealthSummary()
              );

            if (
              !dryRunContract.recordCountsMatch
            ) {
              throw new Error(
                dryRunContract.blockers[0] ??
                  "Migration upload dry-run counts do not match the checkpoint."
              );
            }

            const validation =
              await adapter
                .validateMigrationDraft(
                  draftId
                );

            if (!validation.isValid) {
              throw new Error(
                validation.blockers[0] ||
                  "Migration checkpoint is not valid."
              );
            }

            setMessage(
              `Migration checkpoint validated. Dry-run matched ${dryRunContract.currentRecordCount} records.`
            );
          }

          if (action === "stage-upload") {
            const draft =
              requireMigrationUploadStagingDraft(
                drafts,
                draftId
              );
            const dryRunContract =
              createMigrationUploadDryRunContract(
                draft,
                getApplicationDataHealthSummary()
              );

            if (
              !dryRunContract.recordCountsMatch
            ) {
              throw new Error(
                dryRunContract.blockers[0] ??
                  "Migration upload dry-run counts do not match the checkpoint."
              );
            }

            const staging =
              await adapter
                .stageMigrationUploadManifest(
                  draftId,
                  createMigrationUploadManifest(
                    dryRunContract
                  )
                );

            setMessage(
              `Upload manifest staged. ${staging.stagedRecordCount} records accounted for.`
            );
          }

          if (action === "commit") {
            const draft =
              requireMigrationCommitDraft(
                drafts,
                draftId
              );
            const localHousehold =
              loadHousehold();

            requireMigrationCommitLocalOwner(
              draft,
              localHousehold?.members.map(
                (member) => member.id
              ) ?? []
            );
            requireMigrationCommitLocalLink(
              draft,
              localHousehold?.authenticatedLink
            );
            requireMigrationCommitUploadStaged(
              draft
            );

            const commitResult =
              await adapter
              .commitMigrationDraft(
                draftId
              );

            assertMigrationCommitResultMatchesDraft(
              draft,
              commitResult
            );

            const linkedHousehold =
              linkHouseholdToAuthenticatedTenant({
                remoteHouseholdId:
                  commitResult.householdId,
                migrationId:
                  commitResult.migrationId,
                ownerMemberId:
                  draft.ownerMemberId,
                linkedByUserId:
                  draft.requestedByUserId,
                linkedAt:
                  commitResult.committedAt,
              });

            if (!linkedHousehold) {
              throw new Error(
                "Remote persistence committed, but local link state could not be saved."
              );
            }

            setMessage(
              "Remote persistence committed."
            );
          }

          if (action === "abort") {
            requireMigrationAbortDraft(
              drafts,
              draftId
            );

            await adapter
              .abortMigrationDraft(
                draftId
              );

            setMessage(
              "Migration checkpoint aborted."
            );
          }

          await loadDrafts();
          onStatusChange?.();
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Migration checkpoint action failed."
          );
        } finally {
          setIsLoading(false);
          setActionDraftId("");
        }
      },
      [
        drafts,
        loadDrafts,
        onStatusChange,
      ]
    );

  if (drafts.length === 0) {
    return null;
  }

  return (
    <section className="migration-checkpoint-panel">
      <div className="migration-checkpoint-panel__header">
        <div>
          <h2>
            Migration Checkpoints
          </h2>
          <p>
            Prototype remote persistence status for claimed households.
          </p>
        </div>
        <CloudUpload
          size={20}
          aria-hidden="true"
        />
      </div>

      {error && (
        <div
          role="alert"
          className="migration-checkpoint-panel__error"
        >
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          className="migration-checkpoint-panel__message"
        >
          {message}
        </div>
      )}

      <div className="migration-checkpoint-panel__list">
        {drafts.map((draft) => {
          const isCurrentAction =
            isLoading &&
            actionDraftId === draft.id;
          const dryRunContract =
            createMigrationUploadDryRunContract(
              draft,
              getApplicationDataHealthSummary()
            );
          const canValidate =
            draft.status === "uploaded";
          const canStageUpload =
            draft.status === "validated" &&
            dryRunContract.recordCountsMatch;
          const canCommit =
            false;
          const canAbort =
            draft.status !== "committed" &&
            draft.status !== "aborted";
          const lifecycleEntries =
            getMigrationCheckpointLifecycleEntries(
              draft
            );

          return (
            <article
              key={draft.id}
              className="migration-checkpoint-panel__item"
            >
              <div className="migration-checkpoint-panel__item-header">
                <div>
                  <h3>
                    {draft.householdName}
                  </h3>
                  <p>
                    {draft.remoteRecordCount} records staged
                  </p>
                </div>
                <span
                  className="migration-checkpoint-panel__status"
                  data-status={draft.status}
                >
                  {draft.status}
                </span>
              </div>

              <dl className="migration-checkpoint-panel__meta">
                <div>
                  <dt>Household</dt>
                  <dd>
                    {draft.householdId}
                  </dd>
                </div>
                <div>
                  <dt>Checkpoint</dt>
                  <dd>
                    {draft.id}
                  </dd>
                </div>

                {lifecycleEntries.map(
                  (entry) => (
                    <div
                      key={entry.label}
                      className="migration-checkpoint-panel__lifecycle"
                    >
                      <dt>
                        {entry.label}
                      </dt>
                      <dd>
                        {entry.value}
                      </dd>
                    </div>
                  )
                )}
              </dl>

              <div className="migration-checkpoint-panel__dry-run">
                <div>
                  <strong>
                    Dry-run upload contract
                  </strong>
                  <span
                    data-status={
                      dryRunContract
                        .recordCountsMatch
                        ? "pass"
                        : "blocked"
                    }
                  >
                    {dryRunContract
                      .recordCountsMatch
                      ? "Ready"
                      : "Review"}
                  </span>
                </div>
                <p>
                  {dryRunContract.currentRecordCount} current records compared with {dryRunContract.checkpointRecordCount} checkpoint records.
                </p>
              </div>

              <div className="migration-checkpoint-panel__actions">
                <button
                  type="button"
                  onClick={() => {
                    void runAction(
                      draft.id,
                      "validate"
                    );
                  }}
                  disabled={
                    isLoading || !canValidate
                  }
                  title="Validate migration checkpoint"
                >
                  <ShieldCheck
                    size={16}
                    aria-hidden="true"
                  />
                  Validate
                </button>

                <button
                  type="button"
                  onClick={() => {
                    void runAction(
                      draft.id,
                      "stage-upload"
                    );
                  }}
                  disabled={
                    isLoading || !canStageUpload
                  }
                  title="Stage the migration upload manifest"
                >
                  <CloudUpload
                    size={16}
                    aria-hidden="true"
                  />
                  {isCurrentAction
                    ? "Working"
                    : "Stage upload"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    void runAction(
                      draft.id,
                      "commit"
                    );
                  }}
                  disabled={
                    isLoading || !canCommit
                  }
                  title="Commit remains locked until full record upload staging is implemented"
                >
                  <CheckCircle2
                    size={16}
                    aria-hidden="true"
                  />
                  {isCurrentAction
                    ? "Working"
                    : "Commit locked"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    void runAction(
                      draft.id,
                      "abort"
                    );
                  }}
                  disabled={
                    isLoading || !canAbort
                  }
                  title="Abort migration checkpoint"
                >
                  <XCircle
                    size={16}
                    aria-hidden="true"
                  />
                  Abort
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
