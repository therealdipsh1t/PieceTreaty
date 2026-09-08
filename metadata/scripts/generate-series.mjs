#!/usr/bin/env node
/**
 * Generate trait rolls, SVG art, and ERC-721 metadata JSON for a series.
 *
 * Usage:
 *   node scripts/generate-series.mjs --config config/series-1.json
 *   node scripts/generate-series.mjs --config config/series-1.json --count 5 --publishBase ipfs://QmJson/
 *
 * Output (per series):
 *   generated/<slug>/
 *     images/{tokenId}.svg
 *     json/{tokenId}.json      ← upload this folder; baseURI ends with /
 *     manifest.json
 *     _collection-preview.html
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hashSeed, mulberry32, pickWeighted } from "./lib/rng.mjs";
import { renderSvg } from "./lib/art.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function parseArgs(argv) {
  const args = { config: null, count: null, start: null, publishBase: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--config") args.config = argv[++i];
    else if (a === "--count") args.count = Number(argv[++i]);
    else if (a === "--start") args.start = Number(argv[++i]);
    else if (a === "--publishBase") args.publishBase = argv[++i];
    else if (a === "--help" || a === "-h") args.help = true;
  }
  return args;
}

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true });
}

function rollTraits(seriesConfig, tokenId) {
  const rng = mulberry32(hashSeed("legally-mime", seriesConfig.seriesId, tokenId));
  const traits = {};
  for (const [traitType, options] of Object.entries(seriesConfig.attributes)) {
    traits[traitType] = pickWeighted(rng, options);
  }
  return traits;
}

function fillTemplate(tpl, vars) {
  return tpl.replace(/\{(\w+)\}/g, (_, key) =>
    vars[key] !== undefined && vars[key] !== null ? String(vars[key]) : `{${key}}`
  );
}

function buildTokenMetadata({ collection, series, tokenId, traits, imageUri, externalUrl }) {
  return {
    name: `Legally Mime #${tokenId}`,
    description: `${series.description}\n\nSeries: ${series.name}`,
    image: imageUri,
    external_url: externalUrl,
    background_color: "0b0a12",
    attributes: [
      { trait_type: "Series", value: series.name },
      { trait_type: "Series ID", value: series.seriesId, display_type: "number" },
      ...Object.entries(traits).map(([trait_type, value]) => ({ trait_type, value })),
    ],
    properties: {
      series_id: series.seriesId,
      series_slug: series.slug,
      token_id: tokenId,
      collection: collection.name,
      generator: "legally-mime-metadata@1.0.0",
    },
  };
}

function writePreviewHtml(outDir, series, tokens) {
  const cards = tokens
    .map(
      (t) => `
    <figure class="card">
      <img src="images/${t.tokenId}.svg" alt="#${t.tokenId}" width="200" height="200"/>
      <figcaption>
        <strong>#${t.tokenId}</strong>
        <span>${t.traits.Rarity || ""} · ${t.traits.Prop || ""}</span>
      </figcaption>
    </figure>`
    )
    .join("\n");

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${series.name} — preview</title>
  <style>
    body { margin:0; font-family: ui-monospace, monospace; background:#0b0a12; color:#f4f1ff; padding:2rem; }
    h1 { font-family: system-ui, sans-serif; }
    .muted { color:#9b95b3; }
    .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:1rem; margin-top:1.5rem; }
    .card { margin:0; border:1px solid rgba(255,255,255,.08); border-radius:12px; overflow:hidden; background:#161322; }
    .card img { display:block; width:100%; height:auto; background:#12101c; }
    figcaption { padding:.65rem .75rem; display:flex; flex-direction:column; gap:.25rem; font-size:.8rem; }
    figcaption span { color:#9b95b3; }
  </style>
</head>
<body>
  <h1>${series.name}</h1>
  <p class="muted">${series.description}</p>
  <p class="muted">Generated ${tokens.length} tokens · start #${series.startTokenId}</p>
  <div class="grid">${cards}</div>
</body>
</html>`;
  fs.writeFileSync(path.join(outDir, "_collection-preview.html"), html);
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help || !args.config) {
    console.log(`Usage: node scripts/generate-series.mjs --config config/series-1.json [options]
Options:
  --count N          Override token count
  --start N          Override start token id
  --publishBase URL  Base used in image URIs (e.g. ipfs://Qm... or http://localhost:5173/metadata/series-1)
`);
    process.exit(args.help ? 0 : 1);
  }

  const configPath = path.isAbsolute(args.config) ? args.config : path.join(ROOT, args.config);
  const series = loadJson(configPath);
  const collection = loadJson(path.join(ROOT, "config", "collection.json"));

  if (args.count != null) series.count = args.count;
  if (args.start != null) series.startTokenId = args.start;
  if (args.publishBase) series.publishBase = args.publishBase.replace(/\/$/, "");

  const start = Number(series.startTokenId);
  const count = Number(series.count);
  if (!Number.isFinite(start) || start < 1) throw new Error("startTokenId must be >= 1");
  if (!Number.isFinite(count) || count < 1) throw new Error("count must be >= 1");

  const outDir = path.join(ROOT, "generated", series.slug);
  const imgDir = path.join(outDir, "images");
  const jsonDir = path.join(outDir, "json");
  ensureDir(imgDir);
  ensureDir(jsonDir);

  const tokens = [];
  const rarityCounts = {};

  for (let i = 0; i < count; i++) {
    const tokenId = start + i;
    const traits = rollTraits(series, tokenId);
    rarityCounts[traits.Rarity] = (rarityCounts[traits.Rarity] || 0) + 1;

    const svg = renderSvg({
      tokenId,
      seriesName: series.name,
      traits,
      paletteMap: series.palette || {},
    });
    fs.writeFileSync(path.join(imgDir, `${tokenId}.svg`), svg);

    const imageUri = fillTemplate(series.imageUriTemplate, {
      publishBase: series.publishBase,
      id: tokenId,
      seriesId: series.seriesId,
    });
    const externalUrl = fillTemplate(series.externalUrlTemplate || "https://legallymime.example/token/{id}", {
      id: tokenId,
      seriesId: series.seriesId,
    });

    const meta = buildTokenMetadata({
      collection,
      series,
      tokenId,
      traits,
      imageUri,
      externalUrl,
    });
    fs.writeFileSync(path.join(jsonDir, `${tokenId}.json`), JSON.stringify(meta, null, 2) + "\n");
    tokens.push({ tokenId, traits, imageUri });
  }

  const manifest = {
    seriesId: series.seriesId,
    slug: series.slug,
    name: series.name,
    startTokenId: start,
    endTokenId: start + count - 1,
    count,
    publishBase: series.publishBase,
    /** Set this as series baseURI on-chain (must end with /) after hosting the json/ folder */
    contractBaseURI: `${series.publishBase.replace(/\/$/, "")}/json/`.replace(
      // if publishBase already ends with series path without json
      /\/json\/json\//,
      "/json/"
    ),
    rarityCounts,
    generatedAt: new Date().toISOString(),
    note:
      "tokenURI = baseURI + tokenId + '.json'. Point baseURI at the hosted json/ directory (with trailing slash).",
    files: {
      images: "images/{id}.svg",
      metadata: "json/{id}.json",
      preview: "_collection-preview.html",
    },
  };

  // Normalize contractBaseURI: prefer .../json/
  const base = series.publishBase.replace(/\/$/, "");
  manifest.contractBaseURI = `${base}/json/`;

  fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  writePreviewHtml(outDir, series, tokens);

  // Collection-level contractURI helper (optional marketplaces)
  const contractUriDoc = {
    name: collection.name,
    description: collection.description,
    image: `${base}/images/${start}.svg`,
    external_link: collection.external_link,
    seller_fee_basis_points: collection.seller_fee_basis_points,
    fee_recipient: collection.fee_recipient,
  };
  fs.writeFileSync(path.join(outDir, "contract.json"), JSON.stringify(contractUriDoc, null, 2) + "\n");

  console.log(`✓ Generated ${count} tokens for "${series.name}"`);
  console.log(`  Token IDs: ${start} – ${start + count - 1}`);
  console.log(`  Output:    ${path.relative(process.cwd(), outDir)}`);
  console.log(`  baseURI →  ${manifest.contractBaseURI}`);
  console.log(`  Rarity:    ${JSON.stringify(rarityCounts)}`);
  console.log(`  Preview:   ${path.join(outDir, "_collection-preview.html")}`);
  console.log(`\nNext: npm run sync-web  (copy into dashboard public/) or upload json/ + images/ to IPFS.`);
}

main();
