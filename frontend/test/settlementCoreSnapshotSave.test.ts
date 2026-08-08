import assert from "node:assert/strict";
import test from "node:test";

import {
  isCoreSnapshotAdminOnlyError,
} from "../src/features/settlements/services/settlementCoreSnapshotSave.ts";

test("settlement core snapshot save detects admin-only permission failures", () => {
  assert.equal(
    isCoreSnapshotAdminOnlyError(
      new Error(
        "Supabase core household snapshot save failed: Only a household admin can save core finance records."
      )
    ),
    true
  );
});

test("settlement core snapshot save keeps unrelated failures fatal", () => {
  assert.equal(
    isCoreSnapshotAdminOnlyError(
      new Error("Cloud account snapshot was not saved.")
    ),
    false
  );
});
