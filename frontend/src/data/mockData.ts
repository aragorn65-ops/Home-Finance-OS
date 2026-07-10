import type { Member, Settlement } from "../types/settlement";

export const members: Member[] = [
  {
    id: "1",
    name: "Alice",
    color: "#3b82f6",
  },
  {
    id: "2",
    name: "Bob",
    color: "#ef4444",
  },
  {
    id: "3",
    name: "Charlie",
    color: "#10b981",
  },
];

export const settlements: Settlement[] = [
  {
    id: "1",

    fromMember: "1",
    toMember: "2",

    amount: 1250,

    date: "2026-07-05",

    notes: "Electricity bill",

    receiptUrl: "https://picsum.photos/600/400",

    paymentBreakdown: [
      {
        category: "Electricity",
        amount: 1250,
      },
    ],
  },
];