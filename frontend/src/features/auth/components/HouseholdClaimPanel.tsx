import "./HouseholdClaimPanel.css";

import {
  useCallback,
  useState,
} from "react";
import { AlertCircle } from "lucide-react";

import type {
  ApplicationBackupSummary,
} from "../../startup/services/applicationBackup";
import {
  createApplicationBackup,
} from "../../startup/services/applicationBackup";
import type {
  StoredHousehold,
} from "../../household/services/householdStorage";
import {
  getAuthBackendAdapter,
} from "../services/createAuthBackendAdapter";
import HouseholdMemberService from "../../household/services/HouseholdMemberService";

export interface HouseholdClaimPanelProps {
  household: StoredHousehold;
  backupSummary: ApplicationBackupSummary;
  onClaimSuccess?: () => void;
  onClaimError?: (error: string) => void;
}

export default function HouseholdClaimPanel({
  household,
  backupSummary,
  onClaimSuccess,
  onClaimError,
}: HouseholdClaimPanelProps) {
  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    showConfirmation,
    setShowConfirmation,
  ] = useState(false);

  const householdMembers =
    HouseholdMemberService.getMembers();
  const ownerMember = householdMembers.find(
    (m) => m.role === "owner"
  );

  const handleClaimClick =
    useCallback(async () => {
      setError("");
      setIsLoading(true);

      try {
        // Create migration checkpoint backup
        const backupResult =
          await createApplicationBackup({
            password: undefined,
          });

        if (!backupResult.success) {
          throw new Error(
            backupResult.message ||
            "Failed to create backup checkpoint"
          );
        }

        // Prepare claim draft
        const claimDraft = {
          householdName:
            household.householdName,
          backupSummary,
          ownerMemberId:
            ownerMember?.id ||
            householdMembers[0]?.id ||
            "",
        };

        // Submit claim
        const claimResult =
          await getAuthBackendAdapter()
            .createHouseholdClaimDraft(
              claimDraft
            );

        // Log claim success for diagnostics
        console.log(
          "Household claimed:",
          claimResult.householdId
        );

        setShowConfirmation(false);
        onClaimSuccess?.();
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Household claim failed";

        setError(message);
        onClaimError?.(message);
      } finally {
        setIsLoading(false);
      }
    }, [
      household,
      householdMembers,
      backupSummary,
      ownerMember,
      onClaimSuccess,
      onClaimError,
    ]);

  return (
    <div className="household-claim-panel">
      <div className="household-claim-panel__header">
        <h2>Claim Household</h2>
        <p>
          Claim this household to prepare it for authenticated storage.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="household-claim-panel__error"
        >
          <AlertCircle
            size={16}
            aria-hidden="true"
          />
          {error}
        </div>
      )}

      <div className="household-claim-panel__summary">
        <div className="household-claim-panel__summary-item">
          <dt>Household Name</dt>
          <dd>
            {household.householdName}
          </dd>
        </div>

        <div className="household-claim-panel__summary-item">
          <dt>Members</dt>
          <dd>
            {householdMembers.length}
          </dd>
        </div>

        <div className="household-claim-panel__summary-item">
          <dt>Owner</dt>
          <dd>
            {ownerMember?.displayName ||
            "Unknown"}
          </dd>
        </div>

        <div className="household-claim-panel__summary-item">
          <dt>Accounts</dt>
          <dd>
            {backupSummary.accountCount}
          </dd>
        </div>

        <div className="household-claim-panel__summary-item">
          <dt>Transactions</dt>
          <dd>
            {
              backupSummary.transactionCount
            }
          </dd>
        </div>
      </div>

      {!showConfirmation ? (
        <button
          type="button"
          className="household-claim-panel__action"
          onClick={() => {
            setShowConfirmation(true);
          }}
          disabled={isLoading}
        >
          Review Claim
        </button>
      ) : (
        <div className="household-claim-panel__confirmation">
          <p>
            Claiming this household will:
          </p>
          <ul>
            <li>
              Create a migration checkpoint backup
            </li>
            <li>
              Link this household to your authenticated account
            </li>
            <li>
              Prepare data for remote storage
            </li>
            <li>
              Keep local-only mode available if you change your mind
            </li>
          </ul>

          <div className="household-claim-panel__confirmation-actions">
            <button
              type="button"
              onClick={() => {
                setShowConfirmation(false);
              }}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="household-claim-panel__confirm-button"
              onClick={() => {
                void handleClaimClick();
              }}
              disabled={
                isLoading || !ownerMember
              }
            >
              {isLoading
                ? "Claiming..."
                : "Claim Household"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
