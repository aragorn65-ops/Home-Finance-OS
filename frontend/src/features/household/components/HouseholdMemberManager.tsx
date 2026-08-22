import {
  useState,
} from "react";
import type {
  FormEvent,
} from "react";

import {
  Dialog,
  DialogBody,
  DialogHeader,
} from "../../../shared/ui";

import HouseholdMemberForm from "./HouseholdMemberForm";

import type {
  HouseholdMember,
} from "../models/HouseholdMember";

import type {
  HouseholdMemberForm as HouseholdMemberFormData,
} from "../models/HouseholdMemberForm";

import HouseholdMemberService from "../services/HouseholdMemberService";
import {
  loadHousehold,
} from "../services/householdStorage";
import {
  getAuthBackendAdapter,
} from "../../auth/services";

interface HouseholdMemberManagerProps {
  isReadOnly?: boolean;
}

type MemberDialogMode =
  | "create"
  | "edit"
  | "invite"
  | null;

function mapMemberToForm(
  member: HouseholdMember
): HouseholdMemberFormData {
  return {
    displayName:
      member.displayName,

    role:
      member.role,

    color:
      member.color ?? "",

    isActive:
      member.isActive,
  };
}

function getRoleLabel(
  role: HouseholdMember["role"]
): string {
  if (role === "owner") {
    return "Owner";
  }

  if (role === "admin") {
    return "Admin";
  }

  return "Member";
}

export default function HouseholdMemberManager({
  isReadOnly = false,
}: HouseholdMemberManagerProps) {
  const household =
    loadHousehold();

  const remoteHouseholdId =
    household?.authenticatedLink
      ?.remoteHouseholdId;

  const [
    members,
    setMembers,
  ] = useState<HouseholdMember[]>(
    () =>
      HouseholdMemberService.getMembers()
  );

  const [
    dialogMode,
    setDialogMode,
  ] = useState<MemberDialogMode>(
    null
  );

  const [
    selectedMember,
    setSelectedMember,
  ] = useState<HouseholdMember | null>(
    null
  );

  const [
    actionError,
    setActionError,
  ] = useState("");

  const [
    inviteEmail,
    setInviteEmail,
  ] = useState("");

  const [
    inviteMessage,
    setInviteMessage,
  ] = useState("");

  const [
    isInviting,
    setIsInviting,
  ] = useState(false);

  const refreshMembers = () => {
    setMembers(
      HouseholdMemberService.getMembers()
    );
  };

  const closeDialog = () => {
    setDialogMode(null);
    setSelectedMember(null);
    setInviteEmail("");
    setInviteMessage("");
  };

  const handleAddMember = () => {
    setActionError("");
    setSelectedMember(null);
    setDialogMode("create");
  };

  const handleEditMember = (
    member: HouseholdMember
  ) => {
    setActionError("");
    setSelectedMember(member);
    setDialogMode("edit");
  };

  const handleInviteMember = (
    member: HouseholdMember
  ) => {
    setActionError("");
    setInviteMessage("");
    setInviteEmail("");
    setSelectedMember(member);
    setDialogMode("invite");
  };

  const handleSubmit = (
    form: HouseholdMemberFormData
  ) => {
    const result =
      dialogMode === "edit" &&
      selectedMember
        ? HouseholdMemberService.updateMember(
            selectedMember.id,
            form
          )
        : HouseholdMemberService.createMember(
            form
          );

    if (result.success) {
      refreshMembers();
      closeDialog();
    }

    return result;
  };

  const handleToggleActive = (
    member: HouseholdMember
  ) => {
    setActionError("");

    const result =
      member.isActive
        ? HouseholdMemberService.deactivate(
            member.id
          )
        : HouseholdMemberService.reactivate(
            member.id
          );

    if (!result.success) {
      const errors =
        result.errors ?? {};

      const firstError =
        Object.values(errors)[0];

      setActionError(
        firstError ??
          result.message ??
          "Unable to update the household member."
      );

      return;
    }

    refreshMembers();
  };

  const handleInviteSubmit = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    if (
      !selectedMember ||
      !remoteHouseholdId
    ) {
      setInviteMessage(
        "Link this household to Supabase before inviting members."
      );

      return;
    }

    setIsInviting(true);
    setInviteMessage("");

    try {
      if (
        inviteEmail.trim() &&
        selectedMember.email !==
          inviteEmail
            .trim()
            .toLowerCase()
      ) {
        HouseholdMemberService.update(
          selectedMember.id,
          {
            displayName:
              selectedMember.displayName,
            email:
              inviteEmail,
            role:
              selectedMember.role,
            color:
              selectedMember.color ?? "",
            isActive:
              selectedMember.isActive,
          }
        );
        refreshMembers();
      }

      const membership =
        await getAuthBackendAdapter()
          .inviteLinkedHouseholdMember({
            householdId:
              remoteHouseholdId,
            localMemberId:
              selectedMember.id,
            displayName:
              selectedMember.displayName,
            email:
              inviteEmail,
            role:
              selectedMember.role,
            redirectTo:
              `${window.location.origin}/app/settings`,
          });

      setInviteMessage(
        `Magic link sent. ${selectedMember.displayName} is linked as ${membership.role}.`
      );
    }
    catch (error) {
      setInviteMessage(
        error instanceof Error
          ? error.message
          : "Unable to invite this household member."
      );
    }
    finally {
      setIsInviting(false);
    }
  };

  return (
    <>
      <section className="space-y-5 rounded-lg border bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Household Members
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Manage who can participate in shared
              expenses and settlements.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddMember}
            hidden={isReadOnly}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Add Member
          </button>
        </div>

        {actionError && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {actionError}
          </div>
        )}

        {members.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No household members are available.
            </p>
          </div>
        ) : (
          <div className="divide-y rounded-md border">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex flex-wrap items-center justify-between gap-4 p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-semibold text-white"
                    style={{
                      backgroundColor:
                        member.color ??
                        "#688F24",
                    }}
                  >
                    {member.displayName
                      .trim()
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium text-foreground">
                        {member.displayName}
                      </p>

                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {getRoleLabel(
                          member.role
                        )}
                      </span>

                      <span
                        className={
                          member.isActive
                            ? "rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                            : "rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                        }
                      >
                        {member.isActive
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {member.role === "owner"
                        ? "Primary household owner"
                        : member.isActive
                          ? "Available for expense sharing"
                          : "Excluded from new expense sharing"}
                    </p>
                  </div>
                </div>

                {!isReadOnly && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleEditMember(
                        member
                      )
                    }
                    className="rounded-md border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    Edit
                  </button>

                  {member.role !==
                    "owner" && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          handleInviteMember(
                            member
                          )
                        }
                        className="rounded-md border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                      >
                        Invite
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleToggleActive(
                            member
                          )
                        }
                        className="rounded-md border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                      >
                        {member.isActive
                          ? "Deactivate"
                          : "Reactivate"}
                      </button>
                    </>
                  )}
                </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <Dialog
        open={dialogMode !== null}
        onClose={closeDialog}
      >
        <DialogHeader
          title={
            dialogMode === "invite"
              ? "Invite Household Member"
              : dialogMode === "edit"
              ? "Edit Household Member"
              : "Add Household Member"
          }
        />

        <DialogBody>
          {dialogMode === "invite" &&
          selectedMember ? (
            <form
              onSubmit={handleInviteSubmit}
              className="space-y-5"
            >
              <div className="space-y-2">
                <label
                  htmlFor="household-member-invite-email"
                  className="text-sm font-medium text-foreground"
                >
                  Email
                </label>

                <input
                  id="household-member-invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(event) =>
                    setInviteEmail(
                      event.target.value
                    )
                  }
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground"
                  placeholder="member@example.com"
                  required
                />
              </div>

              <div className="rounded-md border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                {selectedMember.displayName} will be
                linked as {getRoleLabel(
                  selectedMember.role
                )}.
              </div>

              {inviteMessage && (
                <div className="rounded-md border px-4 py-3 text-sm text-foreground">
                  {inviteMessage}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeDialog}
                  className="rounded-md border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    isInviting ||
                    !remoteHouseholdId
                  }
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isInviting
                    ? "Sending..."
                    : "Send Invite"}
                </button>
              </div>
            </form>
          ) : (
            <HouseholdMemberForm
              initialValues={
                dialogMode === "edit" &&
                selectedMember
                  ? mapMemberToForm(
                      selectedMember
                    )
                  : undefined
              }
              isOwner={
                selectedMember?.role ===
                "owner"
              }
              submitLabel={
                dialogMode === "edit"
                  ? "Update Member"
                  : "Add Member"
              }
              onSubmit={handleSubmit}
              onCancel={closeDialog}
            />
          )}
        </DialogBody>
      </Dialog>
    </>
  );
}
