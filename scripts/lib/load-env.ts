// Minimal .env.local loader for tsx scripts (Next loads it for the app, but
// standalone scripts don't). Only sets keys not already in the environment.
import { readFileSync } from "node:fs";
import path from "node:path";

export function loadEnvLocal(): void {
  try {
    const text = readFileSync(path.join(process.cwd(), ".env.local"), "utf-8");
    for (const line of text.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq === -1) continue;
      const key = t.slice(0, eq).trim();
      let val = t.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    /* no .env.local — rely on the ambient environment */
  }
}
