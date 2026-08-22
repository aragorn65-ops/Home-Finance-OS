import type { HouseholdMember } from "../../household/models/HouseholdMember";
import {
  resolveHouseholdMemberReference,
  resolveSingleUnmatchedMember,
} from "../../household/services/householdMemberResolution";

import type {
  TransactionForm,
} from "../models/TransactionForm";

export function normalizeTransactionFormMemberReferences(
  form: TransactionForm,
  members: HouseholdMember[]
): TransactionForm {
  const normalizeMemberId = (
    memberId: string,
    knownMemberIds: string[] = []
  ): string => {
    return (
      resolveHouseholdMemberReference(
        members,
        memberId
      )?.id ??
      resolveSingleUnmatchedMember(
        members,
        memberId,
        knownMemberIds
      )?.id ??
      memberId
    );
  };

  const rawAllocationMemberIds =
    form.allocations.map(
      (allocation) =>
        allocation.memberId
    );

  return {
    ...form,
    paidByMemberId:
      normalizeMemberId(
        form.paidByMemberId,
        rawAllocationMemberIds
      ),
    allocations:
      form.allocations.map(
        (allocation) => {
          const knownMemberIds = [
            form.paidByMemberId,
            ...rawAllocationMemberIds.filter(
              (memberId) =>
                memberId !==
                allocation.memberId
            ),
          ];

          return {
            ...allocation,
            memberId:
              normalizeMemberId(
                allocation.memberId,
                knownMemberIds
              ),
          };
        }
      ),
  };
}
