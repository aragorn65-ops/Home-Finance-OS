import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

test("Cloudflare Pages uses its native SPA fallback without a looping rewrite", () => {
  assert.equal(existsSync(new URL("../index.html", import.meta.url)), true);
  assert.equal(existsSync(new URL("../public/404.html", import.meta.url)), false);
  assert.equal(existsSync(new URL("../public/_redirects", import.meta.url)), false);
});
