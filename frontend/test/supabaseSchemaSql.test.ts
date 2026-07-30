import assert from "node:assert/strict";
import {
  readFileSync,
} from "node:fs";
import {
  join,
} from "node:path";
import test from "node:test";

test("Supabase household preference RPC references the active membership helper", () => {
  const schemaSql =
    readFileSync(
      join(
        process.cwd(),
        "..",
        "docs",
        "architecture",
        "supabase-spike-schema.sql"
      ),
      "utf8"
    );

  assert.match(
    schemaSql,
    /create or replace function public\.load_household_preferences[\s\S]+public\.is_active_household_member\(target_household_id\)/
  );
  assert.doesNotMatch(
    schemaSql,
    /public\.is_household_member\(target_household_id\)/
  );
});
