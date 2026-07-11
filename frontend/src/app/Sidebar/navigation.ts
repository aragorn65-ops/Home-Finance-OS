import {
  LayoutDashboard,
  BookOpen,
  Settings,
  CreditCard,
  HandCoins,
  PiggyBank,
  BarChart3,
  Info,
} from "lucide-react";

export const navigation = [
  {
    section: "MAIN",
    items: [
      {
        label: "Dashboard",
        icon: LayoutDashboard,
        path: "/",
      },
      {
        label: "Knowledge Center",
        icon: BookOpen,
        path: "/knowledge-center",
      },
      {
        label: "Settings",
        icon: Settings,
        path: "/settings",
      },
    ],
  },
  {
    section: "FINANCES",
    items: [
      {
        label: "Expenses",
        icon: CreditCard,
        path: "/expenses",
      },
      {
        label: "Settlements",
        icon: HandCoins,
        path: "/settlements",
      },
      {
        label: "Savings",
        icon: PiggyBank,
        path: "/savings",
      },
      {
        label: "Reports",
        icon: BarChart3,
        path: "/reports",
      },
    ],
  },
  {
    section: "SYSTEM",
    items: [
      {
        label: "About",
        icon: Info,
        path: "/about",
      },
    ],
  },
];