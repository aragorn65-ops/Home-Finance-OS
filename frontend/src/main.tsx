import "./shared/theme/reset.css";
import "./styles/theme.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { attachmentContentStore } from "./shared/storage/attachmentContentStore";
import { HFOS_STORAGE_KEYS } from "./shared/storage/localStorageStore";
import {
  applyThemePreference,
  getStoredThemePreference,
} from "./shared/theme/themePreference";

applyThemePreference(
  getStoredThemePreference()
);

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(<p role="status">Opening saved records...</p>);

async function start() {
  try {
    await attachmentContentStore.migrate(window.localStorage, Object.values(HFOS_STORAGE_KEYS));
    // Repository modules must not initialize before attachment references can be resolved.
    const { default: App } = await import("./App");
    root.render(<React.StrictMode><App /></React.StrictMode>);
  } catch (error) {
    root.render(<main role="alert" style={{ padding: "2rem", maxWidth: "44rem", margin: "auto" }}>
      <h1>Receipt storage could not be opened</h1>
      <p>{error instanceof Error ? error.message : "Browser storage is unavailable."}</p>
      <p>Your saved records have not been cleared. Keep your backup and do not clear browser data.</p>
      <button onClick={() => { void start(); }}>Retry</button>
    </main>);
  }
}

void start();
