import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const form = readFileSync(new URL("../src/features/utilities/components/UtilityBillForm.tsx", import.meta.url), "utf8").replace(/\r\n/g, "\n");

test("utilities refreshes paid and unpaid lists on cloud restore without resetting payment drafts", () => {
  const page = readFileSync(new URL("../src/features/utilities/pages/UtilitiesPage.tsx", import.meta.url), "utf8");
  const effect = page.slice(page.indexOf("  useEffect(() => {"), page.indexOf("  }, []);", page.indexOf("  useEffect(() => {")));
  assert.match(effect, /setProviderBills\(/);
  assert.match(effect, /setPaidProviderBills\(/);
  assert.match(effect, /addEventListener\(coreSnapshotRestoredEvent, refreshProviderBills\)/);
  assert.match(effect, /removeEventListener\(coreSnapshotRestoredEvent, refreshProviderBills\)/);
  assert.doesNotMatch(effect, /setProviderPaymentForms|setFormKey/);
});

test("utility save refreshes locally persisted bills before handling cloud failure", () => {
  const page = readFileSync(new URL("../src/features/utilities/pages/UtilitiesPage.tsx", import.meta.url), "utf8");
  const save = page.slice(page.indexOf("const handleSave = async"));
  const creation = save.indexOf("await UtilityProviderBillService.createUnpaid");
  const refresh = save.indexOf("setProviderBills(", creation);
  const failure = save.indexOf("if (!result.success)", creation);
  assert.ok(creation >= 0 && refresh > creation && refresh < failure);
  assert.match(save.slice(failure), /setSaveError\(\s*result.message \?\?/);
  const duplicate = save.slice(0, creation);
  assert.match(duplicate, /setProviderBills\(/);
  assert.match(duplicate, /setPaidProviderBills\(/);
  assert.match(duplicate, /setSaveError\(/);
});

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
