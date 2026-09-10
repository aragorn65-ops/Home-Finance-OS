import type { SettlementAllocationOption } from "../../settlements/models/SettlementAllocationOption";
import { normalizeTransactionCategory } from "../../transactions/models/TransactionCategory";

interface SettlementPreview {
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  allocationCount: number;
  items: Array<{ category: string; amount: number; count: number }>;
}

export function getSettlementPreviews(
  allocations: SettlementAllocationOption[],
  resolveMemberId: (id: string) => string
): SettlementPreview[] {
  const previews = new Map<string, SettlementPreview>();
  const round = (amount: number) => Math.round(amount * 100) / 100;
  for (const allocation of allocations) {
    if (allocation.outstandingAmount <= 0) continue;
    const fromMemberId = resolveMemberId(allocation.fromMemberId);
    const toMemberId = resolveMemberId(allocation.toMemberId);
    const key = JSON.stringify([fromMemberId, toMemberId]);
    const preview = previews.get(key) ?? { fromMemberId, toMemberId, amount: 0, allocationCount: 0, items: [] };
    preview.amount = round(preview.amount + allocation.outstandingAmount);
    preview.allocationCount += 1;
    const category = normalizeTransactionCategory(allocation.category);
    const item = preview.items.find((entry) => entry.category === category);
    if (item) {
      item.amount = round(item.amount + allocation.outstandingAmount);
      item.count += 1;
    } else {
      preview.items.push({ category, amount: allocation.outstandingAmount, count: 1 });
    }
    previews.set(key, preview);
  }
  return [...previews.values()].map((preview) => ({
    ...preview, items: preview.items.sort((a, b) => b.amount - a.amount),
  })).sort((a, b) => b.amount - a.amount);
}
