import assert from "node:assert/strict";
import test from "node:test";
import { subscribeToCoreSnapshotRefreshFallback } from "../src/features/auth/services/coreSnapshotRefreshFallback.ts";

function fixture() {
  const browserEvents = new EventTarget();
  const pageEvents = new EventTarget();
  let tick = () => {};
  let cleared = false;
  let busy = false;
  let refreshes = 0;
  const page = Object.assign(pageEvents, { visibilityState: "visible" as DocumentVisibilityState });
  const browser = Object.assign(browserEvents, {
    setInterval: ((callback: () => void, delay: number) => {
      assert.equal(delay, 30000);
      tick = callback;
      return 1;
    }) as Window["setInterval"],
    clearInterval: (id: number | undefined) => { assert.equal(id, 1); cleared = true; },
  });
  const stop = subscribeToCoreSnapshotRefreshFallback(
    () => { refreshes += 1; }, () => busy, browser, page
  );
  return { browser, page, stop, tick: () => tick(), count: () => refreshes,
    cleared: () => cleared, setBusy: (value: boolean) => { busy = value; } };
}

test("visible browser refreshes periodically even with no realtime notification", () => {
  const f = fixture();
  assert.equal(f.count(), 0);
  f.tick();
  f.tick();
  assert.equal(f.count(), 2);
  f.stop();
});

test("fallback skips hidden pages and in-flight restores, catches up on return", () => {
  const f = fixture();
  f.page.visibilityState = "hidden";
  f.tick();
  f.browser.dispatchEvent(new Event("focus"));
  assert.equal(f.count(), 0);
  f.page.visibilityState = "visible";
  f.setBusy(true);
  f.tick();
  assert.equal(f.count(), 0);
  f.setBusy(false);
  f.page.dispatchEvent(new Event("visibilitychange"));
  f.browser.dispatchEvent(new Event("online"));
  f.browser.dispatchEvent(new Event("focus"));
  assert.equal(f.count(), 3);
  f.stop();
});

test("leaving the linked session removes timer and event listeners", () => {
  const f = fixture();
  f.stop();
  assert.equal(f.cleared(), true);
  f.page.dispatchEvent(new Event("visibilitychange"));
  f.browser.dispatchEvent(new Event("online"));
  f.browser.dispatchEvent(new Event("focus"));
  assert.equal(f.count(), 0);
});
