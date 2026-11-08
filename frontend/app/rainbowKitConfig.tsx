"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { botChain } from "./botchain";

export default getDefaultConfig({
  appName: "PEOPLE",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  chains: [botChain],
  transports: { [botChain.id]: http(botChain.rpcUrls.default.http[0]) },
  ssr: false,
});
