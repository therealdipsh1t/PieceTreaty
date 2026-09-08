import deployment from "./LegallyMimeNFT.json";

export const nftAbi = deployment.abi;

/** Deployed address — override with VITE_NFT_ADDRESS after deploy */
export function getNftAddress() {
  const fromEnv = import.meta.env.VITE_NFT_ADDRESS;
  if (fromEnv && fromEnv.startsWith("0x") && fromEnv.length === 42) {
    return fromEnv;
  }
  if (deployment.address && deployment.address.startsWith("0x")) {
    return deployment.address;
  }
  return null;
}

export function getDeployedChainId() {
  if (import.meta.env.VITE_NFT_CHAIN_ID) {
    return Number(import.meta.env.VITE_NFT_CHAIN_ID);
  }
  return deployment.chainId || 10143;
}

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
