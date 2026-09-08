require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const HARDHAT_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const PRIVATE_KEY =
  process.env.PRIVATE_KEY && /^0x[0-9a-fA-F]{64}$/.test(process.env.PRIVATE_KEY)
    ? process.env.PRIVATE_KEY
    : HARDHAT_KEY;
const MONAD_TESTNET_RPC = process.env.MONAD_TESTNET_RPC || "https://testnet-rpc.monad.xyz";
const MONAD_MAINNET_RPC = process.env.MONAD_MAINNET_RPC || "https://rpc.monad.xyz";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      // OpenZeppelin 5.x uses mcopy (Cancun)
      evmVersion: "cancun",
    },
  },
  networks: {
    hardhat: {},
    monadTestnet: {
      url: MONAD_TESTNET_RPC,
      chainId: 10143,
      accounts: [PRIVATE_KEY],
    },
    monadMainnet: {
      url: MONAD_MAINNET_RPC,
      chainId: 143,
      accounts: [PRIVATE_KEY],
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
