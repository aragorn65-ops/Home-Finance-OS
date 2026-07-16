import type { Account } from "../../accounts/models/Account";

import type { HouseholdMember } from "../../household/models/HouseholdMember";

import type { Settlement } from "../models/Settlement";

import SettlementListItem from "./SettlementListItem";

type SettlementListProps = {
  settlements: Settlement[];

  members: HouseholdMember[];
  accounts: Account[];

  onView?: (
    settlement: Settlement
  ) => void;

  onEdit?: (
    settlement: Settlement
  ) => void;

  onDelete?: (
    settlement: Settlement
  ) => void;
};

export default function SettlementList({
  settlements,

  members,
  accounts,

  onView,
  onEdit,
  onDelete,
}: SettlementListProps) {
  const getMemberName = (
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
      <div className="rounded-lg border border-dashed bg-white p-8 text-center">
        <h3 className="font-semibold text-foreground">
          No settlements yet
        </h3>

        <p className="mt-2 text-sm text-muted-foreground">
          Record a reimbursement when one household
          member pays another member.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {settlements.map(
        (settlement) => (
          <SettlementListItem
            key={settlement.id}
            settlement={settlement}
            fromMemberName={getMemberName(
              settlement.fromMemberId
            )}
            toMemberName={getMemberName(
              settlement.toMemberId
            )}
            sourceAccountName={getAccountName(
              settlement.sourceAccountId
            )}
            destinationAccountName={getAccountName(
              settlement.destinationAccountId
            )}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        )
      )}
    </div>
  );
}