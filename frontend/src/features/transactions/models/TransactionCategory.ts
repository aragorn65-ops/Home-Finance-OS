export const transactionCategories = [
  "Salary",
  "Groceries",
  "Internet",
  "Electricity",
  "Water",
  "Housing",
  "Transportation",
  "Dining",
  "Healthcare",
  "Education",
  "Savings",
  "Settlement",
  "Transfer",
  "Other",
] as const;

export type TransactionCategory =
  typeof transactionCategories[number];

const categoryAliases:
  Record<string, TransactionCategory> = {
    grocery: "Groceries",
    groceries: "Groceries",
    supermarket: "Groceries",
    food: "Groceries",
    internet: "Internet",
    wifi: "Internet",
    "wi-fi": "Internet",
    broadband: "Internet",
    fiber: "Internet",
    fibre: "Internet",
    electricity: "Electricity",
    electric: "Electricity",
    power: "Electricity",
    water: "Water",
    salary: "Salary",
    payroll: "Salary",
    rent: "Housing",
    housing: "Housing",
  };

export function normalizeTransactionCategory(
  category: string
): TransactionCategory {
  const normalized =
    category.trim().toLowerCase();

  if (!normalized) {
    return "Other";
  }

  const alias =
    categoryAliases[normalized];

  if (alias) {
    return alias;
  }

  const directMatch =
    transactionCategories.find(
      (transactionCategory) =>
        transactionCategory.toLowerCase() ===
        normalized
    );

  return directMatch ?? "Other";
}

export function isCanonicalTransactionCategory(
  category: string
): category is TransactionCategory {
  return transactionCategories.some(
    (transactionCategory) =>
      transactionCategory === category
  );
}
