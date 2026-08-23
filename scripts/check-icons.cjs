const fs = require("fs");
const src = fs.readFileSync("src/icons/generated/iconData.ts", "utf8");
const ids = new Set([...src.matchAll(/id: "([^"]+)"/g)].map((m) => m[1]));
const want = [
  "graphBar", "applications", "formField", "server", "table", "map",
  "layers", "pin", "user", "dashboard", "globe", "book", "compass",
  "calendar", "description", "image", "code", "browser", "apps", "gear",
  "cloud", "list",
];
const missing = want.filter((w) => !ids.has(w));
console.log("missing:", missing.length ? missing.join(", ") : "none");
console.log("total:", ids.size);
