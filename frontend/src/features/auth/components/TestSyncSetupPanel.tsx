import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  FormEvent,
} from "react";
import {
  CheckCircle2,
  Cloud,
  CloudDownload,
  Mail,
  Save,
  UserPlus,
} from "lucide-react";

import type {
  ApplicationBackupSummary,
} from "../../startup/services/applicationBackup";
import {
  createApplicationBackup,
} from "../../startup/services/applicationBackup";
import type {
  HouseholdMember,
} from "../../household/models/HouseholdMember";
import type {
  StoredHousehold,
} from "../../household/services/householdStorage";
import {
  linkHouseholdToAuthenticatedTenant,
  saveHouseholdMembers,
} from "../../household/services/householdStorage";
import HouseholdMemberService from "../../household/services/HouseholdMemberService";
import type {
  HouseholdMembership,
  RemoteHouseholdCoreSnapshot,
} from "../models";
import {
  getAuthBackendAdapter,
  getLocalCoreSnapshotCounts,
  loadRemoteCoreSnapshotForHousehold,
  restoreLinkedRemoteCoreSnapshot,
  saveCurrentBrowserCoreSnapshotForHousehold,
} from "../services";
import {
  useAuthSession,
} from "../hooks";
import {
  browserCoreSnapshotLocalWriter,
} from "../services/browserCoreSnapshotLocalWriter";
import {
  browserCoreSnapshotRecordSource,
} from "../services/browserCoreSnapshotRecordSource";

interface TestSyncSetupPanelProps {
  household: StoredHousehold;
  backupSummary: ApplicationBackupSummary;
  onStatusChange?: () => void;
}

interface InviteDiagnosticRecord {
  memberId: string;
  displayName: string;
  email: string;
  role: HouseholdMember["role"];
  status:
    | "ready"
    | "sent"
    | "failed";
  message: string;
  attemptedAt: string;
  remoteMembershipId?: string;
  remoteUserId?: string;
  remoteStatus?: HouseholdMembership["status"];
}

interface InviteFormState {
  displayName: string;
  email: string;
  role: HouseholdMember["role"];
  isActive: boolean;
}

interface SetupStep {
  label: string;
  detail: string;
  status:
    | "pass"
    | "action"
    | "blocked";
}

const defaultInviteForm:
  InviteFormState = {
    displayName: "",
    email: "",
    role: "member",
    isActive: true,
  };

function getDiagnosticsStorageKey(
  householdId: string
): string {
  return `hfos:test-sync-invite-diagnostics:v1:${householdId}`;
}

function getErrorMessage(
  error: unknown
): string {
  if (
    error instanceof Error &&
    error.message.trim()
  ) {
    return error.message;
  }

  return "Action failed.";
}

function loadInviteDiagnostics(
  householdId: string
): InviteDiagnosticRecord[] {
  try {
    const raw =
      window.localStorage.getItem(
        getDiagnosticsStorageKey(
          householdId
        )
      );

    if (!raw) {
      return [];
    }

    const parsed =
      JSON.parse(raw);

    return Array.isArray(parsed)
      ? parsed.filter(
          (record): record is InviteDiagnosticRecord =>
            typeof record?.memberId === "string" &&
            typeof record?.email === "string"
        )
      : [];
  } catch {
    return [];
  }
}

function saveInviteDiagnostics(
  householdId: string,
  diagnostics: InviteDiagnosticRecord[]
): void {
  window.localStorage.setItem(
    getDiagnosticsStorageKey(
      householdId
    ),
    JSON.stringify(diagnostics)
  );
}

function formatDateTime(
  value?: string | Date
): string {
  if (!value) {
    return "not recorded";
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "not recorded";
  }

  return date.toLocaleString();
}

function getStatusLabel(
  status: "pass" | "action" | "blocked"
): string {
  if (status === "pass") {
    return "Ready";
  }

  if (status === "blocked") {
    return "Blocked";
  }

  return "Next";
}

export default function TestSyncSetupPanel({
  household,
  backupSummary,
  onStatusChange,
}: TestSyncSetupPanelProps) {
  const {
    session,
  } = useAuthSession();

  const [
    activeHousehold,
    setActiveHousehold,
  ] = useState(household);
  const [
    members,
    setMembers,
  ] = useState<HouseholdMember[]>(
    () =>
      HouseholdMemberService.getMembers()
  );
  const [
    memberships,
    setMemberships,
  ] = useState<
    HouseholdMembership[]
  >([]);
  const [
    inviteDiagnostics,
    setInviteDiagnostics,
  ] = useState<
    InviteDiagnosticRecord[]
  >(() =>
    loadInviteDiagnostics(
      household.id
    )
  );
  const [
    inviteForm,
    setInviteForm,
  ] = useState(
    defaultInviteForm
  );
  const [
    action,
    setAction,
  ] = useState<
    | "claim"
    | "invite"
    | "load"
    | "owner"
    | "snapshot"
    | "refresh"
    | ""
  >("");
  const [
    ownerDisplayName,
    setOwnerDisplayName,
  ] = useState(
    () =>
      members.find(
        (member) =>
          member.role === "owner" &&
          member.isActive
      )?.displayName ?? ""
  );
  const [
    message,
    setMessage,
  ] = useState("");
  const [
    error,
    setError,
  ] = useState("");
  const [
    snapshotMessage,
    setSnapshotMessage,
  ] = useState("");
  const [
    remoteSnapshot,
    setRemoteSnapshot,
  ] = useState<
    RemoteHouseholdCoreSnapshot | undefined
  >();

  const remoteHouseholdId =
    activeHousehold.authenticatedLink
      ?.remoteHouseholdId;
  const ownerMember =
    members.find(
      (member) =>
        member.role === "owner" &&
        member.isActive
    ) ?? members[0];
  const currentUserMembership =
    memberships.find(
      (membership) =>
        membership.householdId ===
        remoteHouseholdId
    );
  const ownerMembership =
    ownerMember
      ? memberships.find(
          (membership) =>
            membership.householdId ===
              remoteHouseholdId &&
            membership.memberId ===
              ownerMember.id
        )
      : undefined;
  const signedInEmail =
    session.user?.email
      ?.trim()
      .toLowerCase();
  const currentLocalMember =
    members.find(
      (member) =>
        member.id ===
          currentUserMembership?.memberId ||
        member.remoteMemberId ===
          currentUserMembership?.memberId ||
        (
          signedInEmail &&
          member.email
            ?.trim()
            .toLowerCase() ===
            signedInEmail
        )
    );
  const currentDisplayName =
    currentLocalMember?.displayName ??
    currentUserMembership
      ?.memberDisplayName ??
    session.user?.displayName ??
    session.user?.email ??
    "current user";
  const hasOwnerAccess =
    ownerMembership?.role === "owner" ||
    currentUserMembership?.role ===
      "owner";
  const canManageCloudSetup =
    session.status === "signed-in" &&
    (
      !remoteHouseholdId ||
      currentUserMembership?.role ===
        "owner" ||
      currentUserMembership?.role ===
        "admin" ||
      hasOwnerAccess
    );
  const isMemberCloudSession =
    session.status === "signed-in" &&
    Boolean(currentUserMembership) &&
    !canManageCloudSetup;
  const localCounts =
    getLocalCoreSnapshotCounts(
      household.id,
      browserCoreSnapshotRecordSource
    );
  const isBusy =
    action !== "";

  const inviteDiagnosticsByMemberId =
    useMemo(() => {
      return new Map(
        inviteDiagnostics.map(
          (diagnostic) => [
            diagnostic.memberId,
            diagnostic,
          ]
        )
      );
    }, [
      inviteDiagnostics,
    ]);

  const refreshMembers = () => {
    setMembers(
      HouseholdMemberService.getMembers()
    );
  };

  const refreshCloudDiagnostics =
    useCallback(async () => {
      if (
        session.status !== "signed-in"
      ) {
        setMemberships([]);
        setRemoteSnapshot(undefined);
        return;
      }

      setAction("refresh");
      setError("");

      try {
        const adapter =
          getAuthBackendAdapter();
        const nextMemberships =
          await adapter.listMemberships();

        setMemberships(
          nextMemberships
        );

        if (remoteHouseholdId) {
          setRemoteSnapshot(
            await loadRemoteCoreSnapshotForHousehold(
              adapter,
              remoteHouseholdId
            )
          );
        }
      } catch (error) {
        setError(
          getErrorMessage(error)
        );
      } finally {
        setAction("");
      }
    }, [
    session.status,
    session.user?.id,
    remoteHouseholdId,
  ]);

  useEffect(() => {
    setActiveHousehold(household);
    setInviteDiagnostics(
      loadInviteDiagnostics(
        household.id
      )
    );
  }, [
    household,
  ]);

  useEffect(() => {
    setOwnerDisplayName(
      ownerMember?.displayName ?? ""
    );
  }, [
    ownerMember?.id,
    ownerMember?.displayName,
  ]);

  useEffect(() => {
    void refreshCloudDiagnostics();
  }, [
    refreshCloudDiagnostics,
    remoteHouseholdId,
  ]);

  const recordInviteDiagnostic =
    (
      diagnostic:
        InviteDiagnosticRecord
    ) => {
      setInviteDiagnostics(
        (current) => {
          const next = [
            diagnostic,
            ...current.filter(
              (record) =>
                record.memberId !==
                diagnostic.memberId
            ),
          ];

          saveInviteDiagnostics(
            household.id,
            next
          );

          return next;
        }
      );
    };

  const handleClaimHousehold =
    async (): Promise<void> => {
      if (
        session.status !== "signed-in"
      ) {
        setError(
          "Sign in as the household owner before creating the cloud household."
        );
        return;
      }

      if (!ownerMember) {
        setError(
          "Create an owner member before linking the household."
        );
        return;
      }

      setAction("claim");
      setError("");
      setMessage("");

      try {
        const backupResult =
          await createApplicationBackup({
            password: undefined,
          });

        if (!backupResult.success) {
          throw new Error(
            backupResult.message ||
              "Failed to create backup checkpoint."
          );
        }

        const claimResult =
          await getAuthBackendAdapter()
            .createHouseholdClaimDraft({
              householdName:
                household.householdName,
              backupSummary,
            ownerMemberId:
              ownerMember.id,
            ownerDisplayName:
              ownerMember.displayName,
          });

        const linkedHousehold =
          linkHouseholdToAuthenticatedTenant({
            remoteHouseholdId:
              claimResult.householdId,
            migrationId:
              claimResult.migrationDraft
                .id,
            ownerMemberId:
              ownerMember.id,
            linkedByUserId:
              claimResult.migrationDraft
                .requestedByUserId,
            linkedAt:
              claimResult.migrationDraft
                .createdAt,
          });

        if (!linkedHousehold) {
          throw new Error(
            "Cloud household was created, but this browser could not save the local link."
          );
        }

        setActiveHousehold(
          linkedHousehold
        );
        setMessage(
          `Cloud household linked: ${claimResult.householdId}`
        );
        await refreshCloudDiagnostics();
        onStatusChange?.();
      } catch (error) {
        setError(
          getErrorMessage(error)
        );
      } finally {
        setAction("");
      }
    };

  const handleInviteSubmit =
    async (
      event: FormEvent
    ): Promise<void> => {
      event.preventDefault();

      const email =
        inviteForm.email.trim();
      const displayName =
        inviteForm.displayName.trim();

      if (!displayName) {
        setError(
          "Enter the member name before sending the invite."
        );
        return;
      }

      if (!email) {
        setError(
          "Enter the member email before sending the invite."
        );
        return;
      }

      if (
        session.status !== "signed-in"
      ) {
        setError(
          "Sign in as the household owner before sending the invite."
        );
        return;
      }

      if (!remoteHouseholdId) {
        setError(
          "Create/link the cloud household first, then send the invite."
        );
        return;
      }

      setAction("invite");
      setError("");
      setMessage("");

      let member =
        members.find(
          (candidate) =>
            candidate.displayName
              .trim()
              .toLowerCase() ===
            displayName.toLowerCase()
        );

      try {
        if (!member) {
          const result =
            HouseholdMemberService.create({
              displayName,
              email,
              role:
                inviteForm.role,
              color: "",
              isActive:
                inviteForm.isActive,
            });

          if (
            !result.success ||
            !result.data
          ) {
            const firstError =
              result.errors
                ? Object.values(
                    result.errors
                  )[0]
                : "";

            throw new Error(
              firstError ||
                result.message ||
                "Unable to create the local household member."
            );
          }

          member =
            result.data;
          refreshMembers();
        } else if (
          member.email !==
            email.toLowerCase() ||
          member.role !==
            inviteForm.role ||
          member.isActive !==
            inviteForm.isActive
        ) {
          const updateResult =
            HouseholdMemberService.update(
              member.id,
              {
                displayName:
                  member.displayName,
                email,
                role:
                  inviteForm.role,
                color:
                  member.color ?? "",
                isActive:
                  inviteForm.isActive,
              }
            );

          if (
            updateResult.success &&
            updateResult.data
          ) {
            member =
              updateResult.data;
            refreshMembers();
          }
        }

        const membership =
          await getAuthBackendAdapter()
            .inviteLinkedHouseholdMember({
              householdId:
                remoteHouseholdId,
              localMemberId:
                member.id,
              displayName:
                member.displayName,
              email,
              role:
                member.role,
              redirectTo:
                `${window.location.origin}/app/settings`,
            });

        recordInviteDiagnostic({
          memberId:
            member.id,
          displayName:
            member.displayName,
          email,
          role:
            member.role,
          status: "sent",
          message:
            "Supabase accepted the member invite and magic-link request.",
          attemptedAt:
            new Date().toISOString(),
          remoteMembershipId:
            membership.id,
          remoteUserId:
            membership.userId,
          remoteStatus:
            membership.status,
        });

        setInviteForm(
          defaultInviteForm
        );
        setMessage(
          `Invite request sent for ${member.displayName} <${email}>.`
        );
        await refreshCloudDiagnostics();
        onStatusChange?.();
      } catch (error) {
        const errorMessage =
          getErrorMessage(error);

        recordInviteDiagnostic({
          memberId:
            member?.id ??
            `pending-${email}`,
          displayName:
            member?.displayName ??
            displayName,
          email,
          role:
            member?.role ??
            inviteForm.role,
          status: "failed",
          message:
            errorMessage,
          attemptedAt:
            new Date().toISOString(),
        });
        setError(errorMessage);
      } finally {
        setAction("");
      }
    };

  const handleSaveOwnerName =
    async (): Promise<void> => {
      const displayName =
        ownerDisplayName.trim();

      if (!ownerMember) {
        setError(
          "Create an owner member before saving the owner name."
        );
        return;
      }

      if (!displayName) {
        setError(
          "Enter the owner display name before saving."
        );
        return;
      }

      setAction("owner");
      setError("");
      setMessage("");

      try {
        const updatedOwner = {
          ...ownerMember,
          displayName,
          updatedAt:
            new Date(),
        };
        const nextMembers =
          members.map((member) =>
            member.id === ownerMember.id
              ? updatedOwner
              : member
          );

        if (
          !saveHouseholdMembers(
            nextMembers
          )
        ) {
          throw new Error(
            "Owner name could not be saved locally."
          );
        }

        setMembers(nextMembers);

        if (
          remoteHouseholdId &&
          session.status ===
            "signed-in"
        ) {
          const remoteOwnerMemberId =
            ownerMembership?.memberId ??
            (
              currentUserMembership?.role ===
              "owner"
                ? currentUserMembership
                    .memberId
                : undefined
            ) ??
            ownerMember.remoteMemberId ??
            ownerMember.id;

          await getAuthBackendAdapter()
            .updateRemoteHouseholdMemberProfile({
              householdId:
                remoteHouseholdId,
              localMemberId:
                remoteOwnerMemberId,
              displayName,
            });
          await refreshCloudDiagnostics();
        }

        setMessage(
          `Owner display name saved as ${displayName}.`
        );
        onStatusChange?.();
      } catch (error) {
        setError(
          getErrorMessage(error)
        );
      } finally {
        setAction("");
      }
    };

  const handleAddLocalMember =
    (): void => {
      const displayName =
        inviteForm.displayName.trim();
      const email =
        inviteForm.email.trim();

      if (!displayName) {
        setError(
          "Enter the member name before adding the local member."
        );
        return;
      }

      setError("");
      setMessage("");

      const existingMember =
        members.find(
          (candidate) =>
            candidate.displayName
              .trim()
              .toLowerCase() ===
            displayName.toLowerCase()
        );

      if (existingMember) {
        const nextEmail =
          email ||
          existingMember.email ||
          "";

        if (
          existingMember.email !==
            nextEmail.toLowerCase() ||
          existingMember.role !==
            inviteForm.role ||
          existingMember.isActive !==
            inviteForm.isActive
        ) {
          HouseholdMemberService.update(
            existingMember.id,
            {
              displayName:
                existingMember.displayName,
              email: nextEmail,
              role:
                inviteForm.role,
              color:
                existingMember.color ??
                "",
              isActive:
                inviteForm.isActive,
            }
          );
          refreshMembers();
        }

        if (email) {
          recordInviteDiagnostic({
            memberId:
              existingMember.id,
            displayName:
              existingMember.displayName,
            email,
            role:
              existingMember.role,
            status: "ready",
            message:
              "Email recorded locally; invite not sent yet.",
            attemptedAt:
              new Date().toISOString(),
          });
        }

        setMessage(
          `${existingMember.displayName} already exists locally. ${email ? "Email recorded for invite diagnostics." : "Enter an email before sending the invite."}`
        );
        return;
      }

      const result =
        HouseholdMemberService.create({
          displayName,
          email,
          role:
            inviteForm.role,
          color: "",
          isActive:
            inviteForm.isActive,
        });

      if (
        !result.success ||
        !result.data
      ) {
        const firstError =
          result.errors
            ? Object.values(
                result.errors
              )[0]
            : "";

        setError(
          firstError ||
            result.message ||
            "Unable to create the local household member."
        );
        return;
      }

      refreshMembers();
      if (email) {
        recordInviteDiagnostic({
          memberId:
            result.data.id,
          displayName:
            result.data.displayName,
          email,
          role:
            result.data.role,
          status: "ready",
          message:
            "Email recorded locally; invite not sent yet.",
          attemptedAt:
            new Date().toISOString(),
        });
      }

      setMessage(
        `${result.data.displayName} added locally. ${email ? "Email recorded for invite diagnostics." : "Enter an email before sending the invite."}`
      );
    };

  const handleSaveSnapshot =
    async (): Promise<void> => {
      if (!canManageCloudSetup) {
        setError(
          "Only a household admin can save the core household snapshot. Member settlement changes sync separately."
        );
        return;
      }

      if (!remoteHouseholdId) {
        setError(
          "Create or link the cloud household before saving this browser data to cloud."
        );
        return;
      }

      setAction("snapshot");
      setError("");
      setMessage("");
      setSnapshotMessage("");

      try {
        const saved =
          await saveCurrentBrowserCoreSnapshotForHousehold(
            {
              adapter:
                getAuthBackendAdapter(),
              householdId:
                remoteHouseholdId,
              localHouseholdId:
                household.id,
              recordSource:
                browserCoreSnapshotRecordSource,
            }
          );

        setSnapshotMessage(
          `Saved this browser data to cloud: ${saved.accounts.length} accounts, ${saved.transactions.length} transactions, and ${saved.expenseAllocations?.length ?? 0} allocations.`
        );
        setRemoteSnapshot(saved);
        onStatusChange?.();
      } catch (error) {
        setError(
          getErrorMessage(error)
        );
      } finally {
        setAction("");
      }
    };

  const handleLoadCloudSnapshot =
    async (): Promise<void> => {
      if (!remoteHouseholdId) {
        setError(
          "Create or link the cloud household before loading the cloud snapshot."
        );
        return;
      }

      setAction("load");
      setError("");
      setMessage("");
      setSnapshotMessage("");

      try {
        const result =
          await restoreLinkedRemoteCoreSnapshot({
            authEnabled: true,
            household: {
              id:
                household.id,
              authenticatedLink: {
                remoteHouseholdId,
                ownerMemberId:
                  activeHousehold
                    .authenticatedLink
                    ?.ownerMemberId,
              },
            },
            adapter:
              getAuthBackendAdapter(),
            writer:
              browserCoreSnapshotLocalWriter,
          });

        if (
          result.status !== "restored"
        ) {
          throw new Error(
            `Cloud snapshot was not loaded: ${result.reason}.`
          );
        }

        setSnapshotMessage(
          `Loaded cloud snapshot into this browser: ${result.accountCount} accounts and ${result.transactionCount} transactions.`
        );
        setRemoteSnapshot(
          result.snapshot
        );
        onStatusChange?.();
        window.setTimeout(() => {
          window.location.reload();
        }, 500);
      } catch (error) {
        setError(
          getErrorMessage(error)
        );
      } finally {
        setAction("");
      }
    };

  const setupSteps: SetupStep[] = [
    {
      label:
        "Feature/data-entry testing",
      detail:
        "Frozen until cloud link, member invites, and snapshot are green.",
      status:
        "pass" as const,
    },
    {
      label:
        "Owner session",
      detail:
        session.status === "signed-in"
          ? currentUserMembership
            ? `Signed in as ${currentDisplayName} (${currentUserMembership.role})`
            : `Signed in as ${currentDisplayName}`
          : "Sign in before touching cloud setup.",
      status:
        session.status === "signed-in"
          ? "pass"
          : "blocked",
    },
    {
      label:
        "Cloud household link",
      detail:
        remoteHouseholdId
          ? `Linked to ${remoteHouseholdId}`
          : "Create/link a fresh cloud household.",
      status:
        remoteHouseholdId
          ? "pass"
          : "action",
    },
    {
      label:
        "Owner membership",
      detail:
        hasOwnerAccess
          ? `Owner access is active for ${ownerMember?.displayName ?? currentUserMembership?.memberId ?? "the signed-in user"}.`
          : currentUserMembership
            ? `Signed-in user has ${currentUserMembership.role} membership. Core snapshot saves are admin-only.`
            : "No active membership visible for this signed-in user.",
      status:
        hasOwnerAccess
          ? "pass"
          : remoteHouseholdId
            ? "action"
            : "blocked",
    },
    {
      label:
        "Cloud snapshot",
      detail:
        snapshotMessage ||
        (
          isMemberCloudSession
            ? `Member browser can load cloud data and save member actions. This browser: ${localCounts.accountCount} accounts, ${localCounts.transactionCount} transactions. Cloud: ${remoteSnapshot ? `${remoteSnapshot.accounts.length} accounts, ${remoteSnapshot.transactions.length} transactions` : "not checked"}.`
            : `This browser: ${localCounts.accountCount} accounts, ${localCounts.transactionCount} transactions. Cloud: ${remoteSnapshot ? `${remoteSnapshot.accounts.length} accounts, ${remoteSnapshot.transactions.length} transactions` : "not checked"}.`
        ),
      status:
        snapshotMessage
          ? "pass"
          : remoteHouseholdId
            ? "action"
            : "blocked",
    },
  ];

  return (
    <section className="test-sync-setup">
      <div className="test-sync-setup__header">
        <div>
          <h3>
            Test Sync Setup
          </h3>
          <p>
            {canManageCloudSetup
              ? "Use this admin path before entering July and August sample data."
              : "Member browsers load cloud data here; household snapshot saves remain admin-only."}
          </p>
        </div>
        <span>
          Testing Frozen
        </span>
      </div>

      {(message || snapshotMessage) && (
        <div className="test-sync-setup__message">
          {message || snapshotMessage}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="test-sync-setup__error"
        >
          {error}
        </div>
      )}

      <div className="test-sync-setup__steps">
        {setupSteps.map((step) => (
          <div
            key={step.label}
            className="test-sync-setup__step"
            data-status={step.status}
          >
            <div>
              <h4>
                {step.label}
              </h4>
              <p>
                {step.detail}
              </p>
            </div>
            <span>
              {getStatusLabel(
                step.status
              )}
            </span>
          </div>
        ))}
      </div>

      <div className="test-sync-setup__actions">
        {canManageCloudSetup && (
          <button
            type="button"
            onClick={() => {
              void handleClaimHousehold();
            }}
            disabled={
              isBusy ||
              session.status !== "signed-in" ||
              Boolean(remoteHouseholdId)
            }
          >
            <Cloud
              size={16}
              aria-hidden="true"
            />
            Create/Link Cloud Household
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            void refreshCloudDiagnostics();
          }}
          disabled={
            isBusy ||
            session.status !== "signed-in"
          }
        >
          <CheckCircle2
            size={16}
            aria-hidden="true"
          />
          Refresh Status
        </button>
        <button
          type="button"
          onClick={() => {
            void handleLoadCloudSnapshot();
          }}
          disabled={
            isBusy ||
            session.status !== "signed-in" ||
            !remoteHouseholdId
          }
        >
          <CloudDownload
            size={16}
            aria-hidden="true"
          />
          Load Cloud Snapshot
        </button>
        {canManageCloudSetup && (
          <button
            type="button"
            onClick={() => {
              void handleSaveSnapshot();
            }}
            disabled={
              isBusy ||
              session.status !== "signed-in" ||
              !remoteHouseholdId
            }
          >
            <Save
              size={16}
              aria-hidden="true"
            />
            Save This Browser to Cloud
          </button>
        )}
      </div>

      {canManageCloudSetup && (
      <form
        className="test-sync-setup__invite-form"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSaveOwnerName();
        }}
      >
        <div>
          <h4>
            Owner Display Name
          </h4>
          <p>
            This is the name used for the owner in dashboards, transactions, settlements, and member summaries.
          </p>
        </div>

        <div className="test-sync-setup__form-grid">
          <label>
            Owner name
            <input
              value={ownerDisplayName}
              onChange={(event) => {
                setOwnerDisplayName(
                  event.target.value
                );
              }}
              placeholder="Dadi Buboy"
              disabled={isBusy}
            />
          </label>
        </div>

        <div className="test-sync-setup__invite-actions">
          <button
            type="submit"
            disabled={
              isBusy ||
              !ownerMember
            }
          >
            <Save
              size={16}
              aria-hidden="true"
            />
            Save Owner Name
          </button>
        </div>
      </form>
      )}

      {canManageCloudSetup && (
      <form
        className="test-sync-setup__invite-form"
        onSubmit={(event) => {
          void handleInviteSubmit(
            event
          );
        }}
      >
        <div>
          <h4>
            Add Member With Email
          </h4>
          <p>
            This creates the local member if needed, links the same local member id in Supabase, and records the invite result below.
          </p>
        </div>

        <div className="test-sync-setup__form-grid">
          <label>
            Member name
            <input
              value={
                inviteForm.displayName
              }
              onChange={(event) => {
                setInviteForm(
                  (current) => ({
                    ...current,
                    displayName:
                      event.target.value,
                  })
                );
              }}
              placeholder="Rasha"
              disabled={isBusy}
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={
                inviteForm.email
              }
              onChange={(event) => {
                setInviteForm(
                  (current) => ({
                    ...current,
                    email:
                      event.target.value,
                  })
                );
              }}
              placeholder="member@example.com"
              disabled={isBusy}
            />
          </label>
          <label>
            Role
            <select
              value={inviteForm.role}
              onChange={(event) => {
                setInviteForm(
                  (current) => ({
                    ...current,
                    role:
                      event.target.value as HouseholdMember["role"],
                  })
                );
              }}
              disabled={isBusy}
            >
              <option value="member">
                Member
              </option>
              <option value="admin">
                Admin
              </option>
            </select>
          </label>
          <label>
            Expense sharing
            <span className="test-sync-setup__checkbox-row">
              <input
                type="checkbox"
                checked={
                  inviteForm.isActive
                }
                onChange={(event) => {
                  setInviteForm(
                    (current) => ({
                      ...current,
                      isActive:
                        event.target.checked,
                    })
                  );
                }}
                disabled={isBusy}
              />
              Include in new splits
            </span>
          </label>
        </div>

        <div className="test-sync-setup__invite-actions">
          <button
            type="button"
            onClick={handleAddLocalMember}
            disabled={isBusy}
          >
            <UserPlus
              size={16}
              aria-hidden="true"
            />
            Add Local Member
          </button>
          <button
            type="submit"
            disabled={isBusy}
          >
            <Mail
              size={16}
              aria-hidden="true"
            />
            Send Invite
          </button>
        </div>
      </form>
      )}

      <div className="test-sync-setup__diagnostics">
        <div>
          <h4>
            Invite Delivery and Member Mapping
          </h4>
          <p>
            This table shows the local member id, stored email attempt, and the visible Supabase membership for the signed-in account.
          </p>
        </div>

        <div className="test-sync-setup__member-list">
          {members.map((member) => {
            const diagnostic =
              inviteDiagnosticsByMemberId.get(
                member.id
              );
            const membership =
              memberships.find(
                (candidate) =>
                  candidate.householdId ===
                    remoteHouseholdId &&
                  candidate.memberId ===
                    member.id
              );

            return (
              <dl key={member.id}>
                <div>
                  <dt>
                    Member
                  </dt>
                  <dd>
                    {member.displayName}
                  </dd>
                </div>
                <div>
                  <dt>
                    Local member id
                  </dt>
                  <dd>
                    {member.id}
                  </dd>
                </div>
                <div>
                  <dt>
                    Email
                  </dt>
                  <dd>
                    {diagnostic?.email ??
                      (membership?.userId
                        ? session.user?.email
                        : "not recorded")}
                  </dd>
                </div>
                <div>
                  <dt>
                    Invite delivery
                  </dt>
                  <dd>
                    {diagnostic
                      ? `${diagnostic.status}: ${diagnostic.message}`
                      : "not sent from this panel"}
                  </dd>
                </div>
                <div>
                  <dt>
                    Invite time
                  </dt>
                  <dd>
                    {formatDateTime(
                      diagnostic?.attemptedAt
                    )}
                  </dd>
                </div>
                <div>
                  <dt>
                    Split status
                  </dt>
                  <dd>
                    {member.isActive
                      ? "included in new splits"
                      : "opted out of new splits"}
                  </dd>
                </div>
                <div>
                  <dt>
                    Supabase membership
                  </dt>
                  <dd>
                    {membership
                      ? `${membership.status} / ${membership.role}`
                      : diagnostic?.remoteStatus
                        ? `${diagnostic.remoteStatus} from invite response`
                        : "not visible for signed-in user"}
                  </dd>
                </div>
              </dl>
            );
          })}
        </div>
      </div>

      {inviteDiagnostics.length >
        0 && (
        <div className="test-sync-setup__history">
          <h4>
            Last Invite Attempts
          </h4>
          {inviteDiagnostics.map(
            (diagnostic) => (
              <div
                key={`${diagnostic.memberId}-${diagnostic.attemptedAt}`}
              >
                <Mail
                  size={15}
                  aria-hidden="true"
                />
                <span>
                  {diagnostic.displayName} &lt;{diagnostic.email}&gt; - {diagnostic.status} at {formatDateTime(diagnostic.attemptedAt)}
                </span>
              </div>
            )
          )}
        </div>
      )}
    </section>
  );
}
