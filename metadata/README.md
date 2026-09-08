# Metadata & art scaffolding

Generates **deterministic traits**, **SVG art**, and **ERC-721 JSON** for each Legally Mime series.

## Layout

```
metadata/
  config/
    collection.json      # collection-wide info
    series-1.json        # Series 1 — Classics
    series-2.json        # Series 2 — Legal Briefs (token IDs continue)
  scripts/
    generate-series.mjs  # main generator
    sync-to-web.mjs      # copy → web/public/metadata
    serve-preview.mjs    # standalone preview server
    lib/rng.mjs          # seeded RNG
    lib/art.mjs          # SVG renderer
  generated/             # output (gitignored except samples optional)
    series-1-classics/
      images/1.svg
      json/1.json
      manifest.json
      _collection-preview.html
```

## How it maps to the contract

On-chain:

```text
tokenURI(tokenId) = series.baseURI + tokenId + ".json"
```

So after hosting the `json/` folder:

```text
baseURI = https://your-host/metadata/series-1/json/
# or
baseURI = ipfs://<CID>/
```

`1.json` must live at `{baseURI}1.json`. Image URLs inside each JSON point at the `images/` files (or an IPFS images CID).

**Token IDs are global** across series. Series 2 configs use `startTokenId` after Series 1’s range so filenames stay aligned with on-chain IDs.

## Commands

```bash
cd metadata

# Generate sample batches (S1: tokens 1–20, S2: 21–30)
npm run generate:all

# Custom
npm run generate -- --config config/series-1.json --count 100 --start 1

# After IPFS upload, rewrite image bases:
npm run generate -- --config config/series-1.json --publishBase ipfs://QmYourImagesRoot

# Copy into the Vite dashboard public folder
npm run sync-web

# Standalone gallery (no dashboard)
npm run preview
# → http://127.0.0.1:8787/
```

## Local mint testing

1. `npm run generate:all && npm run sync-web`
2. Run the dashboard (`cd ../web && npm run dev`)
3. When creating a series on-chain, set:

| Series | baseURI |
|--------|---------|
| 1 | `http://localhost:5173/metadata/series-1/json/` |
| 2 | `http://localhost:5173/metadata/series-2/json/` |

> Localhost baseURIs only work for **your** browser/wallet tooling on the same machine. For public testnet/mainnet use HTTPS or `ipfs://`.

## IPFS checklist

1. Generate with final `publishBase` for images, e.g.  
   `--publishBase ipfs://QmImagesCid`  
   so each JSON has `"image": "ipfs://QmImagesCid/images/1.svg"`.
2. Upload `generated/<slug>/images/` → note images CID.
3. Re-generate JSON if needed with that `publishBase`.
4. Upload `generated/<slug>/json/` (flat files `1.json`, `2.json`, …) → note JSON CID.
5. On-chain: `setSeriesBaseURI(seriesId, "ipfs://QmJsonCid/")`  
   (trailing slash required).

## Traits

Each series config defines weighted traits: Background, Outfit, Prop, Expression, Rarity. Same `tokenId` + `seriesId` always rolls the same traits (seeded RNG).

## Replacing SVG with real art

1. Drop final PNGs/WebPs into `generated/<slug>/images/` named `{tokenId}.png`.
2. Change `imageUriTemplate` in the series config to `{publishBase}/images/{id}.png`.
3. Re-run generate (or only rewrite JSON) and re-upload.

You can keep trait rolls from `manifest.json` / existing JSON and only swap image files.
