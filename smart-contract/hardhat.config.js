require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

module.exports = {
  solidity: {
    version: "0.8.28",
  },

  networks: {
    "qie-testnet": {
      url: "https://rpc1testnet.qie.digital",
      accounts: [process.env.WALLET_KEY],
      gasPrice: 1000000000,
    },
  },

  etherscan: {
    apiKey: {
      "qie-testnet": "verify" // Blockscout ignores this
    },
    customChains: [
      {
        network: "qie-testnet",
        chainId: 1983,
        urls: {
          apiURL: "https://testnet.qie.digital/api",   // <-- fixed
          browserURL: "https://testnet.qie.digital"
        }
      }
    ]
  },

  sourcify: {
    enabled: false,
  },
};
