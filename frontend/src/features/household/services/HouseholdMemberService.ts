import type {
  HouseholdMember,
} from "../models/HouseholdMember";

import type {
  HouseholdMemberForm,
} from "../models/HouseholdMemberForm";

import HouseholdMemberValidator from "../validators/HouseholdMemberValidator";

import {
  loadHousehold,
  saveHouseholdMembers,
} from "./householdStorage";

import {
  OperationResults,
  type OperationResult,
} from "../../../shared/types/index";

export default class HouseholdMemberService {
  /**
   * Returns all household members.
   *
   * A default owner is created when an existing
   * household has no stored members.
   */
  static getMembers(): HouseholdMember[] {
    const household = loadHousehold();

    if (!household) {
      return [];
    }

    if (household.members.length > 0) {
      return household.members.map(
        (member) => this.clone(member)
      );
    }

    const now = new Date();

    const defaultOwner: HouseholdMember = {
      id: "member-001",
      householdId: household.id,

      displayName: "Primary Member",
      role: "owner",

      isActive: true,

      createdAt: now,
      updatedAt: now,
    };

    saveHouseholdMembers([
      defaultOwner,
    ]);

    return [
      this.clone(defaultOwner),
    ];
  }

  /**
   * Returns active household members.
   */
  static getActiveMembers(): HouseholdMember[] {
    return this.getMembers().filter(
      (member) => member.isActive
    );
  }

  /**
   * Finds a household member by ID.
   */
  static getMemberById(
    id: string
  ): HouseholdMember | undefined {
    return this.getMembers().find(
      (member) => member.id === id
    );
  }

  /**
   * Returns the household owner.
   */
  static getOwner():
    | HouseholdMember
    | undefined {
    return this.getMembers().find(
      (member) =>
        member.role === "owner" &&
        member.isActive
    );
  }

  /**
   * Alias for clearer calling code.
   */
  static getOwnerMember():
    | HouseholdMember
    | undefined {
    return this.getOwner();
  }

  /**
   * Creates a household member.
   */
  static create(
    form: HouseholdMemberForm
  ): OperationResult<HouseholdMember> {
    const household = loadHousehold();

    if (!household) {
      return OperationResults.failure<
        HouseholdMember
      >(
        {
          household:
            "Complete household setup before adding members.",
        },
        "Unable to add household member."
      );
    }

    const validation =
      HouseholdMemberValidator.validate(
        form
      );

    if (!validation.isValid) {
      return OperationResults.failure<
        HouseholdMember
      >(
        validation.errors,
        "Please correct the member details."
      );
    }

    const members = this.getMembers();

    const normalizedName =
      form.displayName
        .trim()
        .toLowerCase();

    const duplicateName =
      members.some(
        (member) =>
          member.displayName
            .trim()
            .toLowerCase() ===
          normalizedName
      );

    if (duplicateName) {
      return OperationResults.failure<
        HouseholdMember
      >(
        {
          displayName:
            "A household member with this name already exists.",
        },
        "Unable to add household member."
      );
    }

    if (
      form.role === "owner" &&
      members.some(
        (member) =>
          member.role === "owner" &&
          member.isActive
      )
    ) {
      return OperationResults.failure<
        HouseholdMember
      >(
        {
          role:
            "This household already has an owner.",
        },
        "Unable to add household member."
      );
    }

    const now = new Date();

    const member: HouseholdMember = {
      id: crypto.randomUUID(),
      householdId: household.id,

      displayName:
        form.displayName.trim(),
      email:
        form.email?.trim()
          .toLowerCase() ||
        undefined,

      role:
        form.role,

      color:
        form.color.trim() ||
        undefined,

      isActive:
        form.isActive,

      createdAt: now,
      updatedAt: now,
    };

    saveHouseholdMembers([
      ...members,
      member,
    ]);

    return OperationResults.success(
      this.clone(member),
      "Household member added successfully."
    );
  }

  /**
   * Alias used by management interfaces.
   */
  static createMember(
    form: HouseholdMemberForm
  ): OperationResult<HouseholdMember> {
    return this.create(form);
  }

  /**
   * Updates an existing household member.
   */
  static update(
    id: string,
    form: HouseholdMemberForm
  ): OperationResult<HouseholdMember> {
    const validation =
      HouseholdMemberValidator.validate(
        form
      );

    if (!validation.isValid) {
      return OperationResults.failure<
        HouseholdMember
      >(
        validation.errors,
        "Please correct the member details."
      );
    }

    const members = this.getMembers();

    const existingIndex =
      members.findIndex(
        (member) => member.id === id
      );

    if (existingIndex === -1) {
      return OperationResults.failure<
        HouseholdMember
      >(
        {
          member:
            "Household member was not found.",
        },
        "Unable to update household member."
      );
    }

    const existing =
      members[existingIndex];

    const normalizedName =
      form.displayName
        .trim()
        .toLowerCase();

    const duplicateName =
      members.some(
        (member) =>
          member.id !== id &&
          member.displayName
            .trim()
            .toLowerCase() ===
            normalizedName
      );

    if (duplicateName) {
      return OperationResults.failure<
        HouseholdMember
      >(
        {
          displayName:
            "A household member with this name already exists.",
        },
        "Unable to update household member."
      );
    }

    if (
      form.role === "owner" &&
      members.some(
        (member) =>
          member.id !== id &&
          member.role === "owner" &&
          member.isActive
      )
    ) {
      return OperationResults.failure<
        HouseholdMember
      >(
        {
          role:
            "This household already has an owner.",
        },
        "Unable to update household member."
      );
    }

    if (
      existing.role === "owner" &&
      form.role !== "owner"
    ) {
      return OperationResults.failure<
        HouseholdMember
      >(
        {
          role:
            "The household owner role cannot be removed.",
        },
        "Unable to update household member."
      );
    }

    if (
      existing.role === "owner" &&
      !form.isActive
    ) {
      return OperationResults.failure<
        HouseholdMember
      >(
        {
          isActive:
            "The household owner cannot be deactivated.",
        },
        "Unable to update household member."
      );
    }

    const updatedMember:
      HouseholdMember = {
        ...existing,

        displayName:
          form.displayName.trim(),
        email:
          form.email?.trim()
            .toLowerCase() ||
          existing.email,

        role:
          form.role,

        color:
          form.color.trim() ||
          undefined,

        isActive:
          form.isActive,

        updatedAt:
          new Date(),
      };

    const updatedMembers = [
      ...members,
    ];

    updatedMembers[
      existingIndex
    ] = updatedMember;

    saveHouseholdMembers(
      updatedMembers
    );

    return OperationResults.success(
      this.clone(updatedMember),
      "Household member updated successfully."
    );
  }

  /**
   * Alias used by management interfaces.
   */
  static updateMember(
    id: string,
    form: HouseholdMemberForm
  ): OperationResult<HouseholdMember> {
    return this.update(id, form);
  }

  /**
   * Deactivates a non-owner household member.
   */
  static deactivate(
    id: string
  ): OperationResult<HouseholdMember> {
    const member =
      this.getMemberById(id);

    if (!member) {
      return OperationResults.failure<
        HouseholdMember
      >(
        {
          member:
            "Household member was not found.",
        },
        "Unable to deactivate household member."
      );
    }

    if (member.role === "owner") {
      return OperationResults.failure<
        HouseholdMember
      >(
        {
          member:
            "The household owner cannot be deactivated.",
        },
        "Unable to deactivate household member."
      );
    }

    return this.update(id, {
      displayName:
        member.displayName,

      role:
        member.role,

      color:
        member.color ?? "",

      isActive:
        false,
    });
  }

  /**
   * Reactivates a household member.
   */
  static reactivate(
    id: string
  ): OperationResult<HouseholdMember> {
    const member =
      this.getMemberById(id);

    if (!member) {
      return OperationResults.failure<
        HouseholdMember
      >(
        {
          member:
            "Household member was not found.",
        },
        "Unable to reactivate household member."
      );
    }

    return this.update(id, {
      displayName:
        member.displayName,

      role:
        member.role,

      color:
        member.color ?? "",

      isActive:
        true,
    });
  }

  /**
   * Returns a defensive member copy.
   */
  private static clone(
    member: HouseholdMember
  ): HouseholdMember {
    return {
      ...member,

      createdAt:
        new Date(member.createdAt),

      updatedAt:
        new Date(member.updatedAt),
    };
  }
}
