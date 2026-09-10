import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("transaction details display saved notes as plain text with multiline wrapping and an empty state", () => {
  const details = readFileSync(new URL("../src/features/transactions/components/TransactionDetails.tsx", import.meta.url), "utf8");
  assert.match(details, /<dt[^>]*>\s*Notes\s*<\/dt>/);
  assert.match(details, /<dd className="[^"]*whitespace-pre-wrap break-words[^"]*">\s*\{transaction.notes\?\.trim\(\) \? transaction.notes : "No notes"\}/);
  assert.doesNotMatch(details, /dangerouslySetInnerHTML/);
});
