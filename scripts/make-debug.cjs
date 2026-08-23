const fs = require("fs");
const src = fs.readFileSync("scripts/generate-icon-index.mjs", "utf8");
const lines = src.split("\n");
const start = lines.findIndex((l) => l.includes("const allMatches"));
const debug = [
  ...lines.slice(0, start).filter((l) => l.startsWith("const") || l.startsWith("function")),
].join("\n");
const mod = debug + "\n" + lines.slice(start).join("\n").replace(/const entries = .*/s, `
const formHits = allMatches.filter(([id]) => id.startsWith("form"));
console.log("allMatches form hits:", formHits.map(([id]) => id).join(", ") || "NONE");
console.log("allMatches total:", allMatches.length);
console.log("prioritized has formField:", prioritized.some(([id]) => id === "formField"));
console.log("prioritized size:", prioritized.length, "entries:", entries.length);
`);
fs.writeFileSync("scripts/debug-icons.mjs", mod.replace(/import \{ createRequire \}.*/,"").replace(/const require = createRequire\(import\.meta\.url\);/,"").replace(/const iconsPackage = require\(.*\);/, "const iconsPackage = require('@esri/calcite-ui-icons');"));
