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
        path: "/app",
      },
      {
        label: "Help Center",
        icon: BookOpen,
        path: "/app/help-center",
      },
      {
        label: "Settings",
        icon: Settings,
        path: "/app/settings",
      },
    ],
  },
  {
    section: "FINANCES",
    items: [
      {
        label: "Expenses",
        icon: CreditCard,
        path: "/app/expenses",
      },
      {
        label: "Settlements",
        icon: HandCoins,
        path: "/app/settlements",
      },
      {
        label: "Savings",
        icon: PiggyBank,
        path: "/app/savings",
      },
      {
        label: "Reports",
        icon: BarChart3,
        path: "/app/reports",
      },
    ],
  },
  {
    section: "SYSTEM",
    items: [
      {
        label: "About",
        icon: Info,
        path: "/app/about",
      },
    ],
  },
];