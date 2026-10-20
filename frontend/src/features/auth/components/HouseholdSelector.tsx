import { useEffect, useRef, useState } from "react";
import type { HouseholdMembership } from "../models";
import { getAuthBackendAdapter } from "../services/createAuthBackendAdapter";
import { saveLinkedHouseholdShell } from "../../household/services/householdStorage";
import Button from "../../../shared/ui/Button";

export default function HouseholdSelector({ memberships, currentHouseholdId, userId }: {
  memberships: HouseholdMembership[];
  currentHouseholdId?: string;
  userId: string;
}) {
  const choices = [...new Map(memberships.map((item) => [item.householdId, item])).values()];
  const [selected, setSelected] = useState(currentHouseholdId ?? "");
  const [names, setNames] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const active = useRef(true);
  const ids = choices.map((item) => item.householdId).sort().join(",");
  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);
  useEffect(() => {
    let current = true;
    for (const id of ids.split(",").filter(Boolean)) {
      void getAuthBackendAdapter().loadRemoteHousehold(id).then((household) => {
        if (current) setNames((previous) => ({ ...previous, [id]: household.name }));
      }).catch(() => { /* The ID remains selectable if its name cannot be loaded. */ });
    }
    return () => { current = false; };
  }, [ids]);

  async function openHousehold() {
    if (busy) return;
    const membership = choices.find((item) => item.householdId === selected);
    if (!membership) return;
    setBusy(true);
    setError("");
    try {
      const adapter = getAuthBackendAdapter();
      const user = await adapter.getCurrentUser();
      if (user?.id !== userId) throw new Error("Your sign-in changed. Refresh before selecting a household.");
      const authorized = (await adapter.listMemberships()).some((item) =>
        item.householdId === selected && item.userId === userId && item.status === "active");
      if (!authorized) throw new Error("Active membership for this household could not be verified.");
      const household = await adapter.loadRemoteHousehold(selected);
      const members = await adapter.listRemoteHouseholdMembers(selected);
      const member = members.find((item) => item.id === membership.memberId || item.remoteMemberId === membership.memberId);
      if (!member || !members.length) throw new Error("Your household member profile could not be loaded.");
      const verifiedUser = await adapter.getCurrentUser();
      if (!active.current) return;
      if (verifiedUser?.id !== userId) throw new Error("Your sign-in changed. Refresh before selecting a household.");
      const saved = saveLinkedHouseholdShell({
        id: household.id, remoteHouseholdId: household.id, householdName: household.name,
        country: household.country ?? "", currency: household.currency ?? "",
        timezone: household.timezone ?? "", ownerMemberId: household.ownerMemberId || members.find((item) => item.role === "owner")?.id || member.id,
        linkedByUserId: userId, member, members, replaceExisting: true,
      });
      if (!saved) throw new Error("The household link could not be saved. Existing records were preserved.");
      window.location.assign(`${import.meta.env.BASE_URL}app`);
    } catch (cause) {
      if (active.current) setError(cause instanceof Error ? cause.message : "The household could not be opened.");
    } finally {
      if (active.current) setBusy(false);
    }
  }
  return (
    <section className="space-y-3" aria-label="Household selection"
      style={{ display: "grid", gap: 12, marginBottom: 24, minWidth: 0 }}>
      <h2 className="text-lg font-semibold text-foreground">Household</h2>
      <label htmlFor="active-household" className="text-foreground">Selected household</label>
      <select id="active-household" value={selected} onChange={(event) => setSelected(event.target.value)}
        disabled={busy} style={{ width: "100%", maxWidth: "100%", minWidth: 0, minHeight: 44,
          padding: "8px 12px", border: "1px solid var(--color-border)", borderRadius: 6,
          color: "var(--color-text)", background: "var(--color-surface)" }}>
        <option value="">Choose a household</option>
        {choices.map((item) => <option key={item.householdId} value={item.householdId}>
          {names[item.householdId] ?? "Household"} - {item.role} - {item.householdId}
        </option>)}
      </select>
      {selected && <p className="text-muted-foreground" style={{ overflowWrap: "anywhere" }}>{selected}</p>}
      {error && <p role="alert" className="text-destructive">{error}</p>}
      <div><Button disabled={!selected || busy} onClick={() => { void openHousehold(); }}>
        {busy ? "Loading..." : "Open Household"}
      </Button></div>
    </section>
  );
}
