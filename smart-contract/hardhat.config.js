require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const accounts = process.env.WALLET_KEY ? [process.env.WALLET_KEY] : [];

module.exports = {
  solidity: { version: "0.8.28", settings: { optimizer: { enabled: true, runs: 200 } } },
  networks: {
    "qie-testnet": { url: "https://rpc1testnet.qie.digital", accounts, gasPrice: 1000000000 },
    bohr: { url: "https://rpc.bohr.life", chainId: 968, accounts },
  },
  etherscan: {
    apiKey: { "qie-testnet": "verify", bohr: "verify" },
    customChains: [
      { network: "qie-testnet", chainId: 1983, urls: { apiURL: "https://testnet.qie.digital/api", browserURL: "https://testnet.qie.digital" } },
      { network: "bohr", chainId: 968, urls: { apiURL: "https://scan.bohr.life/api", browserURL: "https://scan.bohr.life" } },
    ],
  },
  sourcify: { enabled: false },
};
