import "./shared/theme/reset.css";
import "./styles/theme.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import {
  applyThemePreference,
  getStoredThemePreference,
} from "./shared/theme/themePreference";

applyThemePreference(
  getStoredThemePreference()
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
