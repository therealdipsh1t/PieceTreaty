#!/usr/bin/env node
/**
 * Copy generated series folders into web/public/metadata so the dashboard
 * can serve metadata locally:
 *   http://localhost:5173/metadata/series-1/json/1.json
 *   http://localhost:5173/metadata/series-1/images/1.svg
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const GEN = path.join(ROOT, "generated");
const WEB = path.resolve(ROOT, "..", "web", "public", "metadata");

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

if (!fs.existsSync(GEN)) {
  console.error("No generated/ folder. Run: npm run generate:all");
  process.exit(1);
}

fs.mkdirSync(WEB, { recursive: true });

const seriesDirs = fs.readdirSync(GEN, { withFileTypes: true }).filter((d) => d.isDirectory());
if (seriesDirs.length === 0) {
  console.error("generated/ is empty. Run: npm run generate:all");
  process.exit(1);
}

for (const d of seriesDirs) {
  const slug = d.name;
  // Map series-1-classics → series-1 for shorter public URLs matching config publishBase
  const short = slug.replace(/^series-(\d+).*/, "series-$1");
  const dest = path.join(WEB, short);
  if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true });
  copyDir(path.join(GEN, slug), dest);
  console.log(`✓ ${slug} → web/public/metadata/${short}`);
}

// Index page
const links = seriesDirs
  .map((d) => {
    const short = d.name.replace(/^series-(\d+).*/, "series-$1");
    return `<li><a href="./${short}/_collection-preview.html">${short}</a> · <a href="./${short}/manifest.json">manifest</a></li>`;
  })
  .join("\n");

fs.writeFileSync(
  path.join(WEB, "index.html"),
  `<!doctype html><html><head><meta charset="utf-8"/><title>Legally Mime metadata</title>
  <style>body{font-family:monospace;background:#0b0a12;color:#f4f1ff;padding:2rem}a{color:#4de1c1}</style>
  </head><body><h1>Metadata preview</h1><ul>${links}</ul></body></html>\n`
);

console.log(`\nLocal baseURI examples:`);
console.log(`  Series 1: http://localhost:5173/metadata/series-1/json/`);
console.log(`  Series 2: http://localhost:5173/metadata/series-2/json/`);
console.log(`Open: http://localhost:5173/metadata/`);
