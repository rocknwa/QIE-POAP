"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { Chain } from "wagmi/chains";

export const bohrTestnet = {
  id: 968,
  name: "Bohr Testnet",
  nativeCurrency: { name: "BOT", symbol: "BOT", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.bohr.life"] } },
  blockExplorers: { default: { name: "Bohr Explorer", url: "https://scan.bohr.life" } },
  testnet: true,
} as const satisfies Chain;

export default getDefaultConfig({
  appName: "PEOPLE",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  chains: [bohrTestnet],
  ssr: false,
});
