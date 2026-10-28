import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import SettlementForm from "../../src/features/settlements/components/SettlementForm";
import type { HouseholdMember } from "../../src/features/household/models/HouseholdMember";
import type { SettlementAllocationOption } from "../../src/features/settlements/models/SettlementAllocationOption";

vi.mock("../../src/features/household/services/householdMemberResolution", () => ({ findHouseholdMemberByReference: () => undefined }));

const members = [
  { id: "rasha", displayName: "Rasha", role: "member" },
  { id: "owner", displayName: "Dadi Buboy", role: "owner" },
].map(member => ({ ...member, householdId: "test", isActive: true, createdAt: new Date(), updatedAt: new Date() })) as HouseholdMember[];
const allocationOptions: SettlementAllocationOption[] = [
  { expenseAllocationId: "one", description: "Electricity share", outstandingAmount: 100.25 },
  { expenseAllocationId: "two", description: "Water share", outstandingAmount: 50.10 },
].map(option => ({ ...option, transactionId: option.expenseAllocationId, fromMemberId: "rasha", toMemberId: "owner",
  allocatedAmount: option.outstandingAmount, paidAmount: 0, transactionDate: new Date(2026, 9, 1), category: "Utilities", paymentStatus: "unpaid" }));

afterEach(cleanup);

it("shows a running selected-dues total before payment entry and updates applied amounts separately", () => {
  const onSubmit = vi.fn();
  render(<SettlementForm householdId="test" accounts={[]} members={members} currency="PHP"
    preferredFromMemberId="rasha" allocationOptions={allocationOptions} onSubmit={onSubmit} />);
  fireEvent.change(screen.getByLabelText("Application Method"), { target: { value: "manual" } });
  fireEvent.change(screen.getByLabelText("Settlement Amount"), { target: { value: "0" } });
  const summary = screen.getByRole("status", { name: "Manual settlement running total" });
  const value = (label: string) => within(summary).getByText(label).nextElementSibling!.textContent;
  fireEvent.click(screen.getByRole("checkbox", { name: /Electricity share/ }));
  expect(value("Selected dues (1)")).toContain("100.25");
  expect(value("Applied amount")).toContain("0.00");
  fireEvent.click(screen.getByRole("checkbox", { name: /Water share/ }));
  expect(value("Selected dues (2)")).toContain("150.35");
  fireEvent.change(screen.getByLabelText("Settlement Amount"), { target: { value: "150.35" } });
  expect(value("Applied amount")).toContain("150.35");
  expect(value("Payment amount")).toContain("150.35");
  fireEvent.change(screen.getAllByLabelText("Applied Amount")[0], { target: { value: "40.25" } });
  expect(value("Applied amount")).toContain("90.35");
  expect(value("Selected dues (2)")).toContain("150.35");
  fireEvent.click(screen.getByRole("checkbox", { name: /Water share/ }));
  expect(value("Selected dues (1)")).toContain("100.25");
  expect(value("Applied amount")).toContain("40.25");
  expect(value("Payment amount")).toContain("150.35");
  expect(onSubmit).not.toHaveBeenCalled();
  expect(summary.className).toContain("sticky top-0");
});
