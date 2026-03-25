import { existsSync } from "node:fs";

function loadIfPresent(path: string): void {
  if (!existsSync(path)) return;
  process.loadEnvFile(path);
}

// Load local overrides first so they win over .env defaults.
loadIfPresent(".env.local");
loadIfPresent(".env");
