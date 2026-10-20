import test from "node:test";
import assert from "node:assert/strict";
import { loadHouseholdBootstrap } from "../src/features/auth/services/loadHouseholdBootstrap.ts";

test("household and member reads start together but bootstrap waits for both", async () => {
  const calls: string[] = [];
  let resolveHousehold!: (value: never) => void;
  let resolveMembers!: (value: never[]) => void;
  let complete = false;
  const pending = loadHouseholdBootstrap({
    loadRemoteHousehold: (id) => {
      calls.push(`household:${id}`);
      return new Promise((resolve) => { resolveHousehold = resolve; });
    },
    listRemoteHouseholdMembers: (id) => {
      calls.push(`members:${id}`);
      return new Promise((resolve) => { resolveMembers = resolve; });
    },
  }, "selected-home").then((result) => { complete = true; return result; });
  assert.deepEqual(calls, ["household:selected-home", "members:selected-home"]);
  resolveMembers([]);
  await Promise.resolve();
  assert.equal(complete, false);
  resolveHousehold({ id: "selected-home" } as never);
  assert.equal((await pending).household.id, "selected-home");
});

test("failed member read rejects bootstrap rather than returning partial household data", async () => {
  await assert.rejects(loadHouseholdBootstrap({
    loadRemoteHousehold: async () => ({ id: "selected-home" }) as never,
    listRemoteHouseholdMembers: async () => { throw new Error("member load failed"); },
  }, "selected-home"), /member load failed/);
});
