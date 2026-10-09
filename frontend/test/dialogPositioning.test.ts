import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const dialog = readFileSync(new URL("../src/shared/ui/Dialog/Dialog.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/shared/ui/Dialog/Dialog.css", import.meta.url), "utf8");
const theme = readFileSync(new URL("../src/styles/theme.css", import.meta.url), "utf8").replaceAll("\r\n", "\n");

test("dark theme overrides reach body-portaled dialogs as well as page content", () => {
  assert.doesNotMatch(theme, /:root\[data-theme="(?:dark|system)"\] \.app-content /);
  for (const mode of ["dark", "system"]) {
    const scope = `:root[data-theme="${mode}"] :is(.app-content, .hfos-dialog)`;
    for (const utility of [".bg-white", ".bg-slate-100, .bg-gray-100", ".text-slate-900, .text-gray-900", ".bg-red-50"]) {
      assert.ok(theme.includes(`${scope} :is(${utility})`), `${mode} dialog mapping missing: ${utility}`);
    }
    assert.ok(theme.includes(`${scope} :is(\n  ${mode === "system" ? "  " : ""}.text-slate-700,`));
  }
  assert.match(theme, /@media \(prefers-color-scheme: dark\)\s*\{\s*:root\[data-theme="system"\] :is\(\.app-content, \.hfos-dialog\)/);
});

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
