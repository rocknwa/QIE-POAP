import { defineChain } from "viem";

/**
 * Single source of truth for the BOT Chain Mainnet integration.
 * Chain, contract and explorer references in the frontend come from here.
 * Contract addresses are intentionally hardcoded (not env-driven) so a stale
 * environment variable can never point the app at an old deployment.
 */
export const botChain = defineChain({
  id: 677,
  name: "BOT Chain Mainnet",
  nativeCurrency: { name: "BOT", symbol: "BOT", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.botchain.ai"] } },
  blockExplorers: { default: { name: "BOTScan", url: "https://scan.botchain.ai" } },
  testnet: false,
});

export const BOT_CHAIN_NAME = botChain.name;
export const BOT_CHAIN_ID = botChain.id;
export const BOT_EXPLORER_URL = botChain.blockExplorers.default.url;
export const BOT_WEBSITE_URL = "https://botchain.ai";

// Deployed BOT Chain Mainnet contracts
export const POAP_DAPP_ADDRESS = "0x5E387971E4e17A0A09fb53E9875fA8291518Ad1A" as const;
export const POAP_FACTORY_ADDRESS = "0x7149b07fEeE078C2ff0EbF60c1fe772b3A34596b" as const;
// Block in which POAPFactory was deployed (tx 0xe4a46ef4e3fd16ce4616a003f95ad3ae5c0651d806c1a90be5c4e755e2440f67)
export const POAP_FACTORY_DEPLOY_BLOCK = 29355852;

// BOTScan link helpers
export const txUrl = (hash: string) => `${BOT_EXPLORER_URL}/tx/${hash}`;
export const addressUrl = (address: string) => `${BOT_EXPLORER_URL}/address/${address}`;
export const tokenUrl = (collection: string, tokenId: string) =>
  `${BOT_EXPLORER_URL}/token/${collection}/instance/${tokenId}`;
