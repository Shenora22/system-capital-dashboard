import { copyFileSync, mkdirSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const source = resolve(repoRoot, "automation/n8n/workflows/lead-capture-alert-template-v2.json");
const destination = resolve(repoRoot, "exports/lead-capture-alert-template-v2.json");

statSync(source);
mkdirSync(dirname(destination), { recursive: true });
copyFileSync(source, destination);

console.log(`Exported n8n lead workflow:\n${source}\n→ ${destination}`);
