import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../src/features/settlements/pages/SettlementsPage.tsx", import.meta.url), "utf8");
const form = readFileSync(new URL("../src/features/settlements/components/SettlementForm.tsx", import.meta.url), "utf8");

test("edit receives the same saved application details used by View", () => {
  assert.match(page, /recordedApplications=\{dialogMode === "edit" \? selectedApplicationDetails : \[\]\}/);
  assert.match(form, /recordedApplications\.map/);
  assert.match(form, /formatAmount\(application\.appliedAmount, currency\)/);
});

test("edit separates saved payment items from optional reallocation candidates", () => {
  assert.match(form, /\[showApplicationEditor, setShowApplicationEditor\] = useState\(false\)/);
  assert.match(form, /\(!storedInitialValues \|\| showApplicationEditor\)/);
  assert.match(form, /Recorded Payment Items/);
  assert.match(form, /Change applied items/);
  assert.match(form, /aria-controls="settlement-application-editor"/);
});
