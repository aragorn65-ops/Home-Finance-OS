import { loadHousehold, saveLinkedHouseholdShell } from "../../household/services/householdStorage";
import { HFOS_STORAGE_KEYS } from "../../../shared/storage/localStorageStore";
import { getApplicationStorage, legacyBrowserPreferenceKeys, preserveLegacyBrowserPreferences } from "../../../shared/storage/userScopedStorage";
import type { AuthBackendAdapter } from "./AuthBackendAdapter";
import { restoreLinkedRemoteCoreSnapshot } from "./coreSnapshotSync";
import { browserCoreSnapshotLocalWriter } from "./browserCoreSnapshotLocalWriter";

const readyKey = "hfos.private-storage-ready.v1";

export async function prepareIsolatedHousehold(
  adapter: Pick<AuthBackendAdapter, "listMemberships" | "loadRemoteHousehold" | "listRemoteHouseholdMembers" | "loadRemoteCoreSnapshot" | "saveRemoteCoreSnapshot">,
  userId: string,
  isCurrent: () => boolean
): Promise<void> {
  const storage = getApplicationStorage();
  if (!storage) throw new Error("Private browser storage is unavailable.");
  const existing = loadHousehold();
  if (existing) {
    if (existing.authenticatedLink && existing.authenticatedLink.linkedByUserId !== userId) {
      throw new Error("This local household belongs to a different user. It has not been opened.");
    }
    if (existing.authenticatedLink && storage.getItem(readyKey) !== userId) {
      preserveLegacyBrowserPreferences(storage);
      const result = await restoreLinkedRemoteCoreSnapshot({ authEnabled: true, household: existing,
        adapter, writer: browserCoreSnapshotLocalWriter, isCurrent });
      if (!isCurrent()) return;
      if (result.status !== "restored") throw new Error("The private cloud cache could not be restored.");
      storage.setItem(readyKey, userId);
    }
    return;
  }
  const memberships = (await adapter.listMemberships())
    .filter((item) => item.userId === userId && item.status === "active")
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  if (!isCurrent()) return;
  const membership = memberships.find((item) => item.role === "owner" || item.role === "admin") ?? memberships[0];
  if (!membership) return;
  const remote = await adapter.loadRemoteHousehold(membership.householdId);
  if (!isCurrent()) return;
  if (remote.id !== membership.householdId) throw new Error("The returned household does not match your membership.");
  const members = await adapter.listRemoteHouseholdMembers(membership.householdId);
  if (!isCurrent()) return;
  const member = members.find((item) => item.id === membership.memberId || item.userId === userId);
  if (!member || (member.userId && member.userId !== userId) ||
      members.some((item) => item.householdId !== membership.householdId)) {
    throw new Error("Your household member profile could not be verified.");
  }
  const keys = [...Object.values(HFOS_STORAGE_KEYS), ...legacyBrowserPreferenceKeys];
  const before = new Map<string, string | null>(keys.map((key) => [key, storage.getItem(key)]));
  try {
    const saved = saveLinkedHouseholdShell({
      id: remote.id, remoteHouseholdId: remote.id, householdName: remote.name,
      country: remote.country ?? "", currency: remote.currency ?? "", timezone: remote.timezone ?? "",
      linkedByUserId: userId,
      ownerMemberId: members.find((item) => item.role === "owner")?.id ?? membership.memberId,
      member, members,
    });
    if (!saved || Object.values(HFOS_STORAGE_KEYS).some((key) => storage.getItem(key) === null)) {
      throw new Error("The private household cache could not be initialized. No legacy data was moved.");
    }
    const result = await restoreLinkedRemoteCoreSnapshot({ authEnabled: true, household: saved,
      adapter, writer: browserCoreSnapshotLocalWriter, isCurrent });
    if (!isCurrent()) return;
    if (result.status !== "restored") throw new Error("The private cloud cache could not be restored.");
    preserveLegacyBrowserPreferences(storage);
    storage.setItem(readyKey, userId);
  } catch (error) {
    if (!isCurrent()) throw error;
    for (const [key, value] of before) {
      if (value === null) storage.removeItem(key);
      else storage.setItem(key, value);
    }
    throw error;
  }
}
