import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateAuthRouteAccess,
} from "../src/features/auth/services/authRouteAccess.ts";

test("auth route access allows local disabled-auth mode", () => {
  const result =
    evaluateAuthRouteAccess({
      authEnabled: false,
      pathname: "/app",
      sessionStatus:
        "signed-out",
    });

  assert.equal(
    result.isAllowed,
    true
  );
});

test("auth route access blocks signed-out app data routes", () => {
  const result =
    evaluateAuthRouteAccess({
      authEnabled: true,
      pathname: "/app/transactions",
      sessionStatus:
        "signed-out",
    });

  assert.equal(
    result.isAllowed,
    false
  );
  assert.equal(
    result.status,
    "signed-out"
  );
});

test("auth route access allows signed-out settings diagnostics", () => {
  const result =
    evaluateAuthRouteAccess({
      authEnabled: true,
      pathname: "/app/settings",
      sessionStatus:
        "signed-out",
    });

  assert.equal(
    result.isAllowed,
    true
  );
});

test("auth route access allows admin routes", () => {
  const result =
    evaluateAuthRouteAccess({
      authEnabled: true,
      pathname: "/app/accounts",
      sessionStatus:
        "signed-in",
      role: "admin",
    });

  assert.equal(
    result.isAllowed,
    true
  );
});

test("auth route access limits member routes to settlements", () => {
  const settlements =
    evaluateAuthRouteAccess({
      authEnabled: true,
      pathname: "/app/settlements",
      sessionStatus:
        "signed-in",
      role: "member",
    });
  const settings =
    evaluateAuthRouteAccess({
      authEnabled: true,
      pathname: "/app/settings",
      sessionStatus:
        "signed-in",
      role: "member",
    });

  assert.equal(
    settlements.isAllowed,
    true
  );
  assert.equal(
    settings.isAllowed,
    false
  );
  assert.equal(
    settings.status,
    "role-blocked"
  );
});
