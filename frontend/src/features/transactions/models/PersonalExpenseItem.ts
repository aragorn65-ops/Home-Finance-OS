export interface PersonalExpenseItem {
  /**
   * Unique identifier used for editing and removing
   * the personal item from the form.
   */
  id: string;

  /**
   * Short description of the item.
   *
   * Examples: Shampoo, Snacks, Coffee.
   */
  description: string;

  /**
   * Amount assigned exclusively to the member.
   */
  amount: number;
}

export function createPersonalExpenseItem(): PersonalExpenseItem {
  return {
    id: crypto.randomUUID(),
    description: "",
    amount: 0,
  };
}

export function calculatePersonalItemsTotal(
  items: PersonalExpenseItem[]
): number {
  const totalCents =
    items.reduce(
      (total, item) =>
        total +
        Math.round(
          (
            Number.isFinite(item.amount)
              ? item.amount
              : 0
          ) * 100
        ),
      0
    );

  return totalCents / 100;
}