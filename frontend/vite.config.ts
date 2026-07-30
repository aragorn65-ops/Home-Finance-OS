import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const buildCommit =
  process.env.CF_PAGES_COMMIT_SHA ??
  process.env.GITHUB_SHA ??
  process.env.VITE_HFOS_BUILD_COMMIT ??
  "local";

const buildBranch =
  process.env.CF_PAGES_BRANCH ??
  process.env.GITHUB_REF_NAME ??
  process.env.VITE_HFOS_BUILD_BRANCH ??
  "local";

export default defineConfig({
  base: process.env.GITHUB_PAGES === "true"
    ? "/Home-Finance-OS/"
    : "/",
  define: {
    "import.meta.env.VITE_HFOS_BUILD_COMMIT":
      JSON.stringify(buildCommit),
    "import.meta.env.VITE_HFOS_BUILD_BRANCH":
      JSON.stringify(buildBranch),
    "import.meta.env.VITE_HFOS_BUILD_TIME":
      JSON.stringify(
        new Date().toISOString()
      ),
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
});
