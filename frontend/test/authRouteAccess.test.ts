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

test("auth route access allows signed-in settings diagnostics before membership", () => {
  const result =
    evaluateAuthRouteAccess({
      authEnabled: true,
      pathname: "/app/settings",
      sessionStatus:
        "signed-in",
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

test("auth route access sends signed-in users without a role to household setup", () => {
  const result =
    evaluateAuthRouteAccess({
      authEnabled: true,
      pathname: "/app/accounts",
      sessionStatus:
        "signed-in",
    });

  assert.equal(
    result.isAllowed,
    false
  );
  assert.equal(
    result.status,
    "membership-required"
  );
  assert.equal(
    result.title,
    "Household Access Required"
  );
});

test("auth route access allows member transparency routes", () => {
  const transactions =
    evaluateAuthRouteAccess({
      authEnabled: true,
      pathname: "/app/transactions",
      sessionStatus:
        "signed-in",
      role: "member",
    });
  const householdMembers =
    evaluateAuthRouteAccess({
      authEnabled: true,
      pathname:
        "/app/household-members",
      sessionStatus:
        "signed-in",
      role: "member",
    });
  const accounts =
    evaluateAuthRouteAccess({
      authEnabled: true,
      pathname: "/app/accounts",
      sessionStatus:
        "signed-in",
      role: "member",
    });

  assert.equal(
    transactions.isAllowed,
    true
  );
  assert.equal(
    householdMembers.isAllowed,
    true
  );
  assert.equal(
    accounts.isAllowed,
    true
  );
});
