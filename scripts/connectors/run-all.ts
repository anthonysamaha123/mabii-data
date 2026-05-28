// Sequential connector runner. Production replaces this with Dagster.
import { execSync } from "node:child_process";

const connectors = ["world-bank", "imf", "comtrade", "fred", "hdx", "who", "owid", "ilostat"];

for (const name of connectors) {
  console.log(`\n=== ${name} ===`);
  try {
    execSync(`npx tsx scripts/connectors/${name}.ts`, { stdio: "inherit" });
  } catch (err) {
    console.error(`${name} failed:`, err);
    process.exitCode = 1;
  }
}
