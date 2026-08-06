import assert from "node:assert/strict";
import test from "node:test";

import {
  getAccountVisibilityLabel,
  isAccountVisibleForMember,
} from "../src/features/accounts/services/accountVisibility.ts";

test("account visibility allows household accounts for any member", () => {
  assert.equal(
    isAccountVisibleForMember(
      {
        ownerMemberId: "member-owner",
        visibility: "household",
      },
      "member-other"
    ),
    true
  );
});

test("account visibility limits personal accounts to their owner", () => {
  assert.equal(
    isAccountVisibleForMember(
      {
        ownerMemberId: "member-owner",
        visibility: "private",
      },
      "member-owner"
    ),
    true
  );

  assert.equal(
    isAccountVisibleForMember(
      {
        ownerMemberId: "member-owner",
        visibility: "private",
      },
      "member-other"
    ),
    false
  );
});

test("account visibility labels private accounts as personal", () => {
  assert.equal(
    getAccountVisibilityLabel({
      ownerMemberId: "member-owner",
      visibility: "private",
    }),
    "Personal"
  );

  assert.equal(
    getAccountVisibilityLabel({
      ownerMemberId: "member-owner",
      visibility: "household",
    }),
    "Household"
  );
});
