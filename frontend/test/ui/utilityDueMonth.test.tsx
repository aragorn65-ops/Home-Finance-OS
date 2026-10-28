import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import UtilitiesPage from "../../src/features/utilities/pages/UtilitiesPage";

vi.mock("../../src/features/auth", () => ({
  coreSnapshotRestoredEvent: "hfos-core-snapshot-restored",
  useHouseholdMembership: () => ({ session: { status: "signed-in", user: { email: "owner@example.test" } }, membership: { role: "owner", memberId: "owner" } }),
}));
vi.mock("../../src/features/household/services/householdStorage", () => ({ loadHousehold: () => ({ id: "test-household" }) }));
vi.mock("../../src/features/household/services/HouseholdMemberService", () => ({ default: { getActiveMembers: () => [{ id: "owner", displayName: "Dadi Buboy" }] } }));
vi.mock("../../src/features/accounts/services/AccountService", () => ({ default: { getActiveAccounts: () => [] } }));
vi.mock("../../src/features/transactions/services/TransactionService", () => ({ default: { getActiveTransactions: () => [] } }));
vi.mock("../../src/features/utilities/components/UtilityBillForm", () => ({ default: () => null }));
vi.mock("../../src/shared/hooks/useReportingMonth", async () => {
  const { useState } = await import("react");
  return { default: () => { const [selectedMonthValue, setSelectedMonthValue] = useState("2026-10"); return { selectedMonthValue, setSelectedMonthValue }; } };
});
vi.mock("../../src/features/utilities/services/UtilityProviderBillService", () => ({ default: {
  getActiveProviderBills: () => [],
  getPaidProviderBills: () => [
    { id: "pldt", providerName: "PLDT", billingDate: new Date(2026, 8, 18), dueDate: new Date(2026, 9, 11), paidAt: new Date(2026, 9, 16), totalBillAmount: 1799 },
    { id: "meralco", providerName: "Meralco", billingDate: new Date(2026, 9, 18), dueDate: new Date(2026, 9, 30), paidAt: new Date(2026, 10, 2), totalBillAmount: 6321.88 },
    { id: "globe", providerName: "Globe Fiber", billingDate: new Date(2026, 9, 1), dueDate: new Date(2026, 9, 18), paidAt: new Date(2026, 9, 29), totalBillAmount: 1499 },
    { id: "water", providerName: "Manila water", billingDate: new Date(2026, 9, 7), dueDate: new Date(2026, 9, 15), paidAt: new Date(2026, 9, 17), totalBillAmount: 1149.04 },
    { id: "november", providerName: "Meralco November", billingDate: new Date(2026, 10, 18), dueDate: new Date(2026, 10, 30), paidAt: new Date(2026, 11, 2), totalBillAmount: 6000 },
  ].map(bill => ({ ...bill, status: "paid", paidByMemberId: "owner", transactionId: `transaction-${bill.id}`, paymentAttachments: [] })),
} }));

afterEach(cleanup);

it("renders all four October payments and preserves actual dates when changing due month", () => {
  render(<MemoryRouter><UtilitiesPage /></MemoryRouter>);
  const table = screen.getByRole("table");
  for (const provider of ["PLDT", "Meralco", "Globe Fiber", "Manila water"]) {
    expect(within(table).getByText(provider)).toBeTruthy();
  }
  expect(within(table).getAllByRole("row")).toHaveLength(5);
  const pldt = within(table).getByText("PLDT").closest("tr")!;
  expect(within(pldt).getByText(new Date(2026, 8, 18).toLocaleDateString())).toBeTruthy();
  expect(within(pldt).getByText(new Date(2026, 9, 11).toLocaleDateString())).toBeTruthy();
  expect(within(pldt).getByText(new Date(2026, 9, 16).toLocaleDateString())).toBeTruthy();
  expect(within(table).getByText(new Date(2026, 10, 2).toLocaleDateString())).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Due month"), { target: { value: "2026-11" } });
  expect(screen.getByText("Meralco November")).toBeTruthy();
  expect(screen.queryByText("PLDT")).toBeNull();
  expect(screen.queryByText("Meralco", { exact: true })).toBeNull();
});
