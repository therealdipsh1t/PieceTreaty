#!/usr/bin/env node
/**
 * Tiny static server for metadata/generated without running the full dashboard.
 *   npm run preview  →  http://127.0.0.1:8787/
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "generated");
const PORT = Number(process.env.PORT || 8787);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".css": "text/css",
};

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  let filePath = path.join(ROOT, urlPath === "/" ? "" : urlPath);

  if (urlPath === "/") {
    const series = fs.existsSync(ROOT)
      ? fs.readdirSync(ROOT, { withFileTypes: true }).filter((d) => d.isDirectory())
      : [];
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<!doctype html><meta charset="utf-8"/><title>Mime metadata</title>
      <body style="font-family:monospace;background:#0b0a12;color:#f4f1ff;padding:2rem">
      <h1>generated/</h1>
      <ul>${series
        .map(
          (d) =>
            `<li><a style="color:#4de1c1" href="/${d.name}/_collection-preview.html">${d.name}</a></li>`
        )
        .join("")}</ul></body>`);
    return;
  }

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403).end("Forbidden");
    return;
  }
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    res.writeHead(404).end("Not found");
    return;
  }
  const ext = path.extname(filePath);
  res.writeHead(200, { "Content-Type": TYPES[ext] || "application/octet-stream" });
  fs.createReadStream(filePath).pipe(res);
});

if (!fs.existsSync(ROOT)) {
  console.error("No generated/ yet. Run: npm run generate:all");
  process.exit(1);
}

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Metadata preview: http://127.0.0.1:${PORT}/`);
});
