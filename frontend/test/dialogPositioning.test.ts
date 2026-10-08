import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const dialog = readFileSync(new URL("../src/shared/ui/Dialog/Dialog.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/shared/ui/Dialog/Dialog.css", import.meta.url), "utf8");

test("dialogs render outside scrolled page containers while retaining React context", () => {
  assert.match(dialog, /return createPortal\(/);
  assert.match(dialog, /<\/DialogContext.Provider>,\s+document.body/);
});

test("dialog autofocus, focus trap and focus restoration do not scroll the page", () => {
  assert.doesNotMatch(dialog, /\.focus\(\)/);
  assert.match(dialog, /firstFocusableElement.focus\(\{ preventScroll: true \}\)/);
  assert.match(dialog, /previouslyFocusedElement.focus\(\{ preventScroll: true \}\)/);
});

test("long dialogs constrain height and scroll the body without shrinking header or footer", () => {
  assert.match(css, /\.hfos-dialog-viewport\s*\{[^}]*box-sizing: border-box;[^}]*position: fixed;/);
  assert.match(css, /max-height: calc\(100dvh - var\(--space-8\)\)/);
  assert.match(css, /\.hfos-dialog__body\s*\{[^}]*min-height: 0;[^}]*overflow-y: auto;/);
  for (const section of ["header", "footer"]) {
    assert.match(css, new RegExp(`\\.hfos-dialog__${section}\\s*\\{[^}]*flex-shrink: 0;`));
  }
});
