# Legally Mime NFT + Dashboard (Monad)

Multi-series ERC-721 collection on **Monad**, with a lean mint dashboard (wallet connect, series browser, mint, gallery, owner admin).

## What’s included

| Path | Purpose |
|------|---------|
| `contracts/` | Hardhat + OpenZeppelin `LegallyMimeNFT` |
| `web/` | Vite + React + wagmi + RainbowKit dashboard |
| `metadata/` | Series configs, SVG art generator, ERC-721 JSON |

### Contract model

- **One contract**, many **series**
- Each series has: name, `baseURI`, max supply, mint price (native **MON**), max per wallet, active flag
- Public `mint(seriesId, quantity)` (paid)
- Owner `ownerMint`, `createSeries`, pause/price/URI controls, `withdraw`
- `tokenURI` = `series.baseURI + tokenId + ".json"` (keep trailing `/` on baseURI)

### Networks

| Network | Chain ID | RPC (public) |
|---------|----------|----------------|
| Monad Testnet | `10143` | `https://testnet-rpc.monad.xyz` |
| Monad Mainnet | `143` | `https://rpc.monad.xyz` |

## Quick start

### 1. Install

```bash
cd contracts && npm install
cd ../web && npm install
```

### 2. Configure

```bash
cp .env.example .env
cp web/.env.example web/.env
```

Put a **testnet-funded** private key in root `.env` as `PRIVATE_KEY`.

Optional: set `VITE_WALLETCONNECT_PROJECT_ID` in `web/.env` ([WalletConnect Cloud](https://cloud.walletconnect.com)).

### 3. Test & compile contracts

```bash
cd contracts
npm test
npm run compile
```

### 4. Deploy to Monad Testnet

```bash
cd contracts
npm run deploy:testnet
```

This writes:

- `contracts/deployments/monadTestnet.json`
- `web/src/lib/LegallyMimeNFT.json` (ABI + address for the UI)

Also set in `web/.env`:

```env
VITE_NFT_ADDRESS=0xYourDeployedAddress
VITE_NFT_CHAIN_ID=10143
```

### 5. Run the dashboard

```bash
cd web
npm run dev
```

Open http://localhost:5173 — connect a wallet on **Monad Testnet**, mint series 1, or create more series if you’re the owner.

### 6. Open another series later

```bash
cd contracts
# optional env overrides: SERIES_NAME, SERIES_BASE_URI, SERIES_MAX_SUPPLY, SERIES_MINT_PRICE, ...
npm run create-series:testnet
```

Or use the **Owner · new series** panel in the dashboard.

## Metadata & art

Scaffolding lives in [`metadata/`](./metadata/README.md).

```bash
cd metadata
npm run generate:all   # Series 1 tokens 1–20, Series 2 tokens 21–30
npm run sync-web       # → web/public/metadata/
npm run preview        # http://127.0.0.1:8787/
```

Each token gets deterministic traits + SVG art + OpenSea-style JSON:

```json
{
  "name": "Legally Mime #1",
  "image": "http://localhost:5173/metadata/series-1/images/1.svg",
  "attributes": [
    { "trait_type": "Series", "value": "Series 1 — Classics" },
    { "trait_type": "Background", "value": "Courtroom" },
    { "trait_type": "Prop", "value": "Gavel" }
  ]
}
```

On-chain `baseURI` for local testing:

| Series | baseURI |
|--------|---------|
| 1 | `http://localhost:5173/metadata/series-1/json/` |
| 2 | `http://localhost:5173/metadata/series-2/json/` |

For production, upload `json/` (and `images/`) to IPFS/HTTPS and call `setSeriesBaseURI`.

## GitHub note

Your empty `therealdipsh1t/dashboard` repo can host this project, or push this folder as a new repo. `synergy-portal` / `Presale-Dashboard` were left alone — this is a **fresh lean** app as requested.

## Security

- Never commit `.env` or private keys
- Test on **testnet** before mainnet (`npm run deploy:mainnet`)
- Review mint price, supply, and `baseURI` before going live
- Consider a multisig owner for mainnet treasury control
