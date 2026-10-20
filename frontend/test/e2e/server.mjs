import { createServer } from "vite";
import process from "node:process";

// Isolated test origin and fake Auth endpoint: never use production credentials.
Object.assign(process.env, {
  VITE_HFOS_AUTH_ENABLED: "true",
  VITE_HFOS_AUTH_PROVIDER: "supabase",
  VITE_SUPABASE_URL: "https://auth.hfos-test.invalid",
  VITE_SUPABASE_ANON_KEY: "test-only-publishable-key",
  VITE_GOOGLE_CLIENT_ID: "",
});
const server = await createServer({ server: { host: "127.0.0.1", port: 5186, strictPort: true } });
await server.listen();
