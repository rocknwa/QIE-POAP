"use client";

import { useAccount, useSwitchChain } from "wagmi";
import { botChain } from "../app/botchain";

/** Network helpers: whether the wallet is on BOT Chain Mainnet and a way to switch before writing. */
export function useBotChain() {
  const { isConnected, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const onBotChain = chainId === botChain.id;

  // Throws if the user rejects the switch / add-network prompt; callers surface it via transactionErrorMessage.
  async function ensureBotChain() {
    if (isConnected && chainId !== botChain.id) {
      await switchChainAsync({ chainId: botChain.id });
    }
  }

  return { onBotChain, ensureBotChain };
}
