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
} from "../../household/services/householdStorage";
import HouseholdMemberService from "../../household/services/HouseholdMemberService";
import type {
  HouseholdMembership,
} from "../models";
import {
  getAuthBackendAdapter,
  getLocalCoreSnapshotCounts,
  saveCurrentBrowserCoreSnapshotForHousehold,
} from "../services";
import {
  useAuthSession,
} from "../hooks";
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
    | "snapshot"
    | "refresh"
    | ""
  >("");
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
        return;
      }

      setAction("refresh");
      setError("");

      try {
        const nextMemberships =
          await getAuthBackendAdapter()
            .listMemberships();

        setMemberships(
          nextMemberships
        );
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

      if (!remoteHouseholdId) {
        setError(
          "Create or link the cloud household before inviting a member."
        );
        return;
      }

      const email =
        inviteForm.email.trim();
      const displayName =
        inviteForm.displayName.trim();

      if (!displayName || !email) {
        setError(
          "Enter the member name and email before sending the invite."
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
              role:
                inviteForm.role,
              color: "",
              isActive: true,
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

  const handleSaveSnapshot =
    async (): Promise<void> => {
      if (!remoteHouseholdId) {
        setError(
          "Create or link the cloud household before saving the clean cloud snapshot."
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
          `Saved ${saved.accounts.length} accounts, ${saved.transactions.length} transactions, and ${saved.expenseAllocations?.length ?? 0} allocations.`
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
          ? `Signed in as ${session.user?.email ?? "current user"}`
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
        ownerMembership
          ? `Owner member ${ownerMember?.displayName ?? ownerMembership.memberId} is active for this signed-in user.`
          : currentUserMembership
            ? `Signed-in user has ${currentUserMembership.role} membership; owner local id is ${ownerMember?.id ?? "missing"}.`
            : "No active membership visible for this signed-in user.",
      status:
        ownerMembership
          ? "pass"
          : remoteHouseholdId
            ? "action"
            : "blocked",
    },
    {
      label:
        "Clean cloud snapshot",
      detail:
        snapshotMessage ||
        `${localCounts.accountCount} local accounts, ${localCounts.transactionCount} local transactions ready to save.`,
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
            Use this admin path before entering July and August sample data.
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
          Save Clean Cloud Snapshot
        </button>
      </div>

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
        </div>

        <button
          type="submit"
          disabled={
            isBusy ||
            session.status !== "signed-in" ||
            !remoteHouseholdId
          }
        >
          <UserPlus
            size={16}
            aria-hidden="true"
          />
          Add Member and Send Invite
        </button>
      </form>

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
