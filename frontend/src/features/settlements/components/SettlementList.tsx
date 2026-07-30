import { EmptyState } from "../../../shared/ui";

import type { Account } from "../../accounts/models/Account";

import type { HouseholdMember } from "../../household/models/HouseholdMember";

import type { Settlement } from "../models/Settlement";
import SettlementApplicationDetailsService from "../services/SettlementApplicationDetailsService";

import SettlementListItem from "./SettlementListItem";

type SettlementListProps = {
  settlements: Settlement[];

  members: HouseholdMember[];
  accounts: Account[];
  currency?: string;

  onView?: (
    settlement: Settlement
  ) => void;

  onEdit?: (
    settlement: Settlement
  ) => void;

  onDelete?: (
    settlement: Settlement
  ) => void;

  getMemberName?: (
    memberId: string
  ) => string;
};

export default function SettlementList({
  settlements,

  members,
  accounts,
  currency,

  onView,
  onEdit,
  onDelete,
  getMemberName,
}: SettlementListProps) {
  const getFallbackMemberName = (
    memberId: string
  ): string => {
    return (
      members.find(
        (member) =>
          member.id === memberId
      )?.displayName ??
      "Unknown Member"
    );
  };

  const resolveMemberName =
    getMemberName ??
    getFallbackMemberName;

  const getAccountName = (
    accountId?: string
  ): string | undefined => {
    if (!accountId) {
      return undefined;
    }

    return accounts.find(
      (account) =>
        account.id === accountId
    )?.name;
  };

  if (settlements.length === 0) {
    return (
      <EmptyState
        title="No settlements yet"
        message="Record reimbursements here after one household member pays another member."
      />
    );
  }

  return (
    <div className="space-y-3">
      {settlements.map(
        (settlement) => (
          <SettlementListItem
            key={settlement.id}
            settlement={settlement}
            applicationDetails={
              SettlementApplicationDetailsService
                .getBySettlementId(
                  settlement.id
                )
            }
            fromMemberName={resolveMemberName(
              settlement.fromMemberId
            )}
            toMemberName={resolveMemberName(
              settlement.toMemberId
            )}
            sourceAccountName={getAccountName(
              settlement.sourceAccountId
            )}
            destinationAccountName={getAccountName(
              settlement.destinationAccountId
            )}
            currency={currency}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        )
      )}
    </div>
  );
}
