const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Create an additional series on an already-deployed contract.
 *
 * Env:
 *   NFT_ADDRESS (optional if deployments/<network>.json exists)
 *   SERIES_NAME, SERIES_BASE_URI, SERIES_MAX_SUPPLY,
 *   SERIES_MINT_PRICE (MON), SERIES_MAX_PER_WALLET, SERIES_ACTIVE
 */
async function main() {
  const network = hre.network.name;
  let address = process.env.NFT_ADDRESS;
  if (!address) {
    const depPath = path.join(__dirname, "..", "deployments", `${network}.json`);
    if (!fs.existsSync(depPath)) {
      throw new Error(`Set NFT_ADDRESS or deploy first (missing ${depPath})`);
    }
    address = JSON.parse(fs.readFileSync(depPath, "utf8")).address;
  }

  const name = process.env.SERIES_NAME || "Series 2 — Legal Briefs";
  const baseURI = process.env.SERIES_BASE_URI || "https://example.com/metadata/s2/";
  const maxSupply = BigInt(process.env.SERIES_MAX_SUPPLY || "500");
  const mintPrice = hre.ethers.parseEther(process.env.SERIES_MINT_PRICE || "0.25");
  const maxPerWallet = BigInt(process.env.SERIES_MAX_PER_WALLET || "3");
  const active = process.env.SERIES_ACTIVE !== "false";

  const nft = await hre.ethers.getContractAt("LegallyMimeNFT", address);
  console.log(`Creating series on ${address} (${network})...`);
  const tx = await nft.createSeries(name, baseURI, maxSupply, mintPrice, maxPerWallet, active);
  const receipt = await tx.wait();
  const count = await nft.seriesCount();
  console.log(`Series created. seriesCount=${count} tx=${receipt.hash}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
