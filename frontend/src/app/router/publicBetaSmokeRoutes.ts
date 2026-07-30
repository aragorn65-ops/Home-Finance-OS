export const publicBetaSmokeRoutes = [
  "/",
  "/app",
  "/app/household-members",
  "/app/accounts",
  "/app/transactions",
  "/app/utilities",
  "/app/settlements",
  "/app/savings",
  "/app/analytics",
  "/app/help-center",
  "/app/settings",
] as const;

export type PublicBetaSmokeRoute =
  (typeof publicBetaSmokeRoutes)[number];
