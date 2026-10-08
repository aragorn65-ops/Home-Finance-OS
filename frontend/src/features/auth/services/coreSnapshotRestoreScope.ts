export class CoreSnapshotRestoreScope {
  private key = "";
  private generation = 0;
  private restored = false;

  select(key: string): number {
    if (this.key !== key) {
      this.key = key;
      this.generation += 1;
      this.restored = false;
    }
    return this.generation;
  }

  isCurrent(generation: number): boolean {
    return this.generation === generation;
  }

  markRestored(generation: number): void {
    if (this.isCurrent(generation)) this.restored = true;
  }

  isRestored(): boolean {
    return this.restored;
  }
}

export function getCoreSnapshotRestoreScopeKey(
  localHouseholdId: string,
  remoteHouseholdId: string,
  userId: string | undefined,
  sessionStatus: string,
  role: string | undefined
): string {
  return JSON.stringify([localHouseholdId, remoteHouseholdId, userId, sessionStatus, role]);
}
