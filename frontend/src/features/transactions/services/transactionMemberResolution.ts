import type {
  ExpenseAllocation,
} from "../models/ExpenseAllocation";
import type {
  Transaction,
} from "../models/Transaction";

export default function resolveTransactionMemberId(
  transaction: Transaction,
  allocations: ExpenseAllocation[] = []
): string {
  return (
    transaction.paidByMemberId ??
    transaction.createdByMemberId ??
    allocations[0]?.paidByMemberId ??
    ""
  );
}
