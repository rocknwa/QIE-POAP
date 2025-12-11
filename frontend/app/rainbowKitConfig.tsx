"use client"

import { getDefaultConfig } from "@rainbow-me/rainbowkit"
import { Chain } from "wagmi/chains"

const qieTestnet = {
  id: 1983,
  name: "qie-testnet",
  nativeCurrency: { name: "QIE", symbol: "QIE", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc1testnet.qie.digital"] } },
  blockExplorers: { 
    default: { 
      name: "QIE Explorer", 
      url: "https://testnet.qie.digital" 
    } 
  },
} as const satisfies Chain;

export default getDefaultConfig({
    appName: "PEOPLECD",
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
    chains: [qieTestnet],
    ssr: false,
})
