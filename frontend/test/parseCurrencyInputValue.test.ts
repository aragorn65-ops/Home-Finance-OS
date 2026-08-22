import assert from "node:assert/strict";
import test from "node:test";

import parseCurrencyInputValue from "../src/shared/utils/parseCurrencyInputValue";

test("currency input accepts comma grouped amounts", () => {
  assert.equal(
    parseCurrencyInputValue(
      "4,253.45"
    ),
    4253.45
  );
});

test("currency input rounds to two decimal places", () => {
  assert.equal(
    parseCurrencyInputValue(
      "4253.456"
    ),
    4253.46
  );
});

test("currency input keeps blank and invalid values at zero", () => {
  assert.equal(
    parseCurrencyInputValue(""),
    0
  );

  assert.equal(
    parseCurrencyInputValue("abc"),
    0
  );
});
