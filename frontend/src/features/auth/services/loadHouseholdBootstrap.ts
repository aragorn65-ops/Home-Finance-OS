import type { AuthBackendAdapter } from "./AuthBackendAdapter";

export async function loadHouseholdBootstrap(
  adapter: Pick<AuthBackendAdapter, "loadRemoteHousehold" | "listRemoteHouseholdMembers">,
  householdId: string
) {
  const [household, members] = await Promise.all([
    adapter.loadRemoteHousehold(householdId),
    adapter.listRemoteHouseholdMembers(householdId),
  ]);
  return { household, members };
}
