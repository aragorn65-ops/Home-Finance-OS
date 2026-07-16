import {
  useState,
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

type MemberDialogMode =
  | "create"
  | "edit"
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

export default function HouseholdMemberManager() {
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

  const refreshMembers = () => {
    setMembers(
      HouseholdMemberService.getMembers()
    );
  };

  const closeDialog = () => {
    setDialogMode(null);
    setSelectedMember(null);
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
                  )}
                </div>
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
            dialogMode === "edit"
              ? "Edit Household Member"
              : "Add Household Member"
          }
        />

        <DialogBody>
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
        </DialogBody>
      </Dialog>
    </>
  );
}
