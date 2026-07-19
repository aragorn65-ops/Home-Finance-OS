import {
  ArrowLeftRight,
  BarChart3,
  CircleHelp,
  Gauge,
  HandCoins,
  LayoutDashboard,
  PiggyBank,
  Settings,
  Users,
  WalletCards,
} from "lucide-react";

export interface NavigationItem {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
}

export interface NavigationSection {
  /**
   * Used by the current SidebarNav component.
   */
  section: string;

  /**
   * Retained for compatibility with other components.
   */
  label: string;

  items: NavigationItem[];
}

export const navigationSections: NavigationSection[] = [
  {
    section: "OVERVIEW",
    label: "OVERVIEW",

    items: [
      {
        label: "Dashboard",
        path: "/app",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    section: "HOUSEHOLD",
    label: "HOUSEHOLD",

    items: [
      {
        label: "Household Members",
        path: "/app/household-members",
        icon: Users,
      },
    ],
  },
  {
    section: "FINANCES",
    label: "FINANCES",

    items: [
      {
        label: "Accounts",
        path: "/app/accounts",
        icon: WalletCards,
      },
      {
        label: "Transactions",
        path: "/app/transactions",
        icon: ArrowLeftRight,
      },
      {
        label: "Utilities",
        path: "/app/utilities",
        icon: Gauge,
      },
      {
        label: "Settlements",
        path: "/app/settlements",
        icon: HandCoins,
      },
      {
        label: "Savings",
        path: "/app/savings",
        icon: PiggyBank,
      },
      {
        label: "Analytics",
        path: "/app/analytics",
        icon: BarChart3,
      },
    ],
  },
  {
    section: "SYSTEM",
    label: "SYSTEM",

    items: [
      {
        label: "Help Center",
        path: "/app/help-center",
        icon: CircleHelp,
      },
      {
        label: "Settings",
        path: "/app/settings",
        icon: Settings,
      },
    ],
  },
];

/**
 * Export expected by SidebarNav.
 */
export const navigation = navigationSections;
