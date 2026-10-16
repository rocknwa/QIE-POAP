require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const rawKey = process.env.WALLET_KEY;

// Normalize the private key so Hardhat always receives a 0x-prefixed key.
const accounts = rawKey
  ? [rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`]
  : [];

module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  networks: {
    "qie-testnet": {
      url: "https://rpc1testnet.qie.digital",
      accounts,
      gasPrice: 1_000_000_000, // 1 gwei
    },

    bohr: {
      url: "https://rpc.bohr.life",
      chainId: 968,
      accounts,

      // Bohr currently requires a minimum effective gas tip of 20 gwei.
      // Use 25 gwei to provide a small margin.
      gasPrice: 25_000_000_000,
    },
  },

  etherscan: {
    apiKey: {
      "qie-testnet": "verify",
      bohr: "verify",
    },

    customChains: [
      {
        network: "qie-testnet",
        chainId: 1983,
        urls: {
          apiURL: "https://testnet.qie.digital/api",
          browserURL: "https://testnet.qie.digital",
        },
      },
      {
        network: "bohr",
        chainId: 968,
        urls: {
          apiURL: "https://scan.bohr.life/api",
          browserURL: "https://scan.bohr.life",
        },
      },
    ],
  },

  sourcify: {
    enabled: false,
  },
};