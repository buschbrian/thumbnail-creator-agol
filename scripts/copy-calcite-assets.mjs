import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const source = join(
  "node_modules",
  "@esri",
  "calcite-components",
  "dist",
  "cdn",
  "assets",
);
const target = join("public", "calcite", "assets");

if (!existsSync(source)) {
  console.error(
    "[copy-calcite-assets] Source not found. Did `npm install` complete?",
  );
  process.exit(1);
}

mkdirSync(target, { recursive: true });
cpSync(source, target, { recursive: true });
console.log("[copy-calcite-assets] Copied Calcite assets to public/calcite");
