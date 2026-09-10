import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const form = readFileSync(new URL("../src/features/utilities/components/UtilityBillForm.tsx", import.meta.url), "utf8").replace(/\r\n/g, "\n");

test("utility Review calculates current shares without a separate calculate button", () => {
  assert.match(form, /isActive=\{activeTab === "review"\}\s+onClick=\{\(\) => calculatePreview\(\)\}/);
  assert.doesNotMatch(form, /Calculate Bill Shares/);
  assert.match(form, /const handleSubmit = \(\): void => \{\s+const calculation =\s+calculatePreview\(\)/);
});

test("utility SAVE uses the shared primary button after the review summary", () => {
  const previewIndex = form.indexOf("<UtilityBillSharePreview");
  const saveIndex = form.indexOf('<Button\n', previewIndex);
  assert.ok(previewIndex > 0);
  assert.ok(saveIndex > previewIndex);
  assert.match(form, /onSubmit && activeTab === "review"/);
  assert.match(form, /<Button\s+variant="primary"/);
  assert.match(form, /submitLabel = "SAVE"/);
  const page = readFileSync(new URL("../src/features/utilities/pages/UtilitiesPage.tsx", import.meta.url), "utf8");
  assert.match(page, /submitLabel="SAVE"/);
});
