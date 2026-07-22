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
} from "../../household/services/householdStorage";
import {
  getAuthBackendAdapter,
} from "../services/createAuthBackendAdapter";
import {
  getMigrationCheckpointLifecycleEntries,
  sortMigrationCheckpointDrafts,
} from "./migrationCheckpointLifecycle";

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
              "Migration checkpoint validated."
            );
          }

          if (action === "commit") {
            const draft =
              drafts.find(
                (candidate) =>
                  candidate.id ===
                  draftId
              );
            const commitResult =
              await adapter
              .commitMigrationDraft(
                draftId
              );

            if (draft) {
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
            }

            setMessage(
              "Remote persistence committed."
            );
          }

          if (action === "abort") {
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
          const canValidate =
            draft.status === "uploaded";
          const canCommit =
            draft.status === "validated";
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
                      "commit"
                    );
                  }}
                  disabled={
                    isLoading || !canCommit
                  }
                  title="Commit remote persistence"
                >
                  <CheckCircle2
                    size={16}
                    aria-hidden="true"
                  />
                  {isCurrentAction
                    ? "Working"
                    : "Commit"}
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
