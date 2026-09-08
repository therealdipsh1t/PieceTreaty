const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const network = hre.network.name;
  const chainId = (await hre.ethers.provider.getNetwork()).chainId;

  console.log(`Deploying LegallyMimeNFT on ${network} (chainId ${chainId})`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance:  ${hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address))} MON`);

  const Factory = await hre.ethers.getContractFactory("LegallyMimeNFT");
  const nft = await Factory.deploy(deployer.address);
  await nft.waitForDeployment();
  const address = await nft.getAddress();
  console.log(`LegallyMimeNFT deployed at: ${address}`);

  // Optional first series from env
  const createFirst = process.env.CREATE_FIRST_SERIES !== "false";
  if (createFirst) {
    const name = process.env.SERIES_NAME || "Series 1 - Classics";
    const baseURI = process.env.SERIES_BASE_URI || "http://localhost:5173/metadata/series-1/json/";
    const maxSupply = BigInt(process.env.SERIES_MAX_SUPPLY || "1000");
    const mintPrice = hre.ethers.parseEther(process.env.SERIES_MINT_PRICE || "0.1");
    const maxPerWallet = BigInt(process.env.SERIES_MAX_PER_WALLET || "5");
    const active = process.env.SERIES_ACTIVE !== "false";

    const tx = await nft.createSeries(name, baseURI, maxSupply, mintPrice, maxPerWallet, active);
    await tx.wait();
    console.log(`Created series #1: "${name}" | max ${maxSupply} | price ${hre.ethers.formatEther(mintPrice)} MON | active=${active}`);
  }

  // Persist deployment for the dashboard
  const outDir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(outDir, { recursive: true });
  const artifact = await hre.artifacts.readArtifact("LegallyMimeNFT");
  const deployment = {
    network,
    chainId: Number(chainId),
    address,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    abi: artifact.abi,
  };
  const outFile = path.join(outDir, `${network}.json`);
  fs.writeFileSync(outFile, JSON.stringify(deployment, null, 2));
  console.log(`Wrote ${outFile}`);

  // Copy ABI + address into the web app
  const webDir = path.join(__dirname, "..", "..", "web", "src", "lib");
  fs.mkdirSync(webDir, { recursive: true });
  fs.writeFileSync(
    path.join(webDir, "LegallyMimeNFT.json"),
    JSON.stringify({ address, chainId: Number(chainId), network, abi: artifact.abi }, null, 2)
  );
  console.log(`Synced ABI to web/src/lib/LegallyMimeNFT.json`);

  const Filings = await hre.ethers.getContractFactory("PieceTreatyFilings");
  const filings = await Filings.deploy(deployer.address, "http://localhost:5173/courthouse/cards/");
  await filings.waitForDeployment();
  const filingsAddress = await filings.getAddress();
  console.log(`PieceTreatyFilings deployed at: ${filingsAddress}`);

  const chase = [
    [1, "Legally Mime", true, 100],
    [2, "The Courtroom", true, 250],
    [3, "Golden Scale", true, 100],
    [4, "Piece Treaty", true, 50],
    [5, "Silent Brief", true, 400],
    [6, "Night Clerk", true, 400],
  ];
  for (const [id, name, isChase, cap] of chase) {
    const tx = await filings.registerCard(id, name, isChase, cap, "");
    await tx.wait();
  }
  console.log(`Registered ${chase.length} chase cards for filing`);

  const filingsArtifact = await hre.artifacts.readArtifact("PieceTreatyFilings");
  fs.writeFileSync(
    path.join(webDir, "PieceTreatyFilings.json"),
    JSON.stringify(
      { address: filingsAddress, chainId: Number(chainId), network, abi: filingsArtifact.abi },
      null,
      2
    )
  );
  console.log(`Synced ABI to web/src/lib/PieceTreatyFilings.json`);
  console.log("\nNext: set VITE_NFT_ADDRESS in web/.env and run the courthouse (`npm run web:dev`).");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
