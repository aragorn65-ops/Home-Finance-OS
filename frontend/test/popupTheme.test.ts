import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import openAttachmentPreview from "../src/shared/utils/openAttachmentPreview.ts";

test("nested validation alerts use theme tokens instead of fixed black text or white panels", () => {
  const source = readFileSync(new URL("../src/shared/ui/FormValidationAlert.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /\b(?:text-black|bg-white|text-gray-700)\b/);
  for (const token of ["--color-surface", "--color-border", "--color-text", "--color-text-strong", "--color-text-muted"]) {
    assert.ok(source.includes(`var(${token})`), `Missing ${token}`);
  }
});

for (const mode of ["light", "dark"]) {
  for (const mimeType of ["image/png", "application/pdf"]) {
    test(`${mode} attachment popup inherits theme without altering ${mimeType} content`, () => {
      const oldWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
      const oldDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
      const children: Array<{ tag: string; src?: string; textContent?: string }> = [];
      const properties: Record<string, string> = {};
      const theme = mode === "dark"
        ? { "--color-canvas": "#0f172a", "--color-surface": "#111827", "--color-text": "#e2e8f0", "--color-border": "#475569" }
        : { "--color-canvas": "#f8fafc", "--color-surface": "#ffffff", "--color-text": "#1e293b", "--color-border": "#cbd5e1" };
      const style = { colorScheme: "", setProperty: (name: string, value: string) => { properties[name] = value; } };
      const preview = {
        title: "",
        documentElement: { style },
        head: { appendChild: () => {} },
        body: { append: () => {} },
        createElement(tag: string) {
          const element = { tag, src: "", textContent: "", appendChild: () => {} };
          children.push(element);
          return element;
        },
      };
      try {
        Object.defineProperty(globalThis, "document", { configurable: true, value: { documentElement: {} } });
        Object.defineProperty(globalThis, "window", { configurable: true, value: {
          open: () => ({ document: preview }),
          getComputedStyle: () => ({ colorScheme: mode, getPropertyValue: (name: string) => theme[name as keyof typeof theme] }),
        } });
        const dataUrl = `data:${mimeType};base64,YWJj`;
        openAttachmentPreview({ fileName: "Receipt <original>", mimeType, dataUrl });
        assert.deepEqual(properties, theme);
        assert.equal(style.colorScheme, mode);
        assert.equal(children.find(child => child.tag === "header")?.textContent, "Receipt <original>");
        assert.equal(children.find(child => child.tag === (mimeType.startsWith("image/") ? "img" : "iframe"))?.src, dataUrl);
        const css = children.find(child => child.tag === "style")?.textContent ?? "";
        assert.match(css, /background: var\(--color-canvas\)/);
        assert.match(css, /color: var\(--color-text\)/);
        assert.doesNotMatch(css, /filter\s*:/);
      } finally {
        if (oldWindow) Object.defineProperty(globalThis, "window", oldWindow);
        else Reflect.deleteProperty(globalThis, "window");
        if (oldDocument) Object.defineProperty(globalThis, "document", oldDocument);
        else Reflect.deleteProperty(globalThis, "document");
      }
    });
  }
}
