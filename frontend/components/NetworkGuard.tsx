"use client";

import { useAccount, useSwitchChain } from "wagmi";
import { botChain, BOT_CHAIN_NAME } from "../app/botchain";
import { transactionErrorMessage } from "../lib/transactionError";

/** Shown only when a wallet is connected to a network other than BOT Chain Mainnet. */
export default function NetworkGuard() {
  const { isConnected, chainId } = useAccount();
  const { switchChain, isPending, error } = useSwitchChain();

  if (!isConnected || chainId === botChain.id) return null;

  return (
    <div role="alert" className="border-b border-red-400/20 bg-red-500/10">
      <div className="people-shell flex flex-col items-start justify-between gap-3 py-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-bold text-red-200">Unsupported network</p>
          <p className="text-xs text-red-100/80">PEOPLE runs on {BOT_CHAIN_NAME}. Switch your wallet to continue.</p>
          {error && <p className="mt-1 text-xs text-red-200">{transactionErrorMessage(error, `Could not switch to ${BOT_CHAIN_NAME}.`)}</p>}
        </div>
        <button type="button" onClick={() => switchChain({ chainId: botChain.id })} disabled={isPending} className="people-button-primary whitespace-nowrap px-4 py-2 text-sm">
          {isPending ? "Switching…" : `Switch to ${BOT_CHAIN_NAME}`}
        </button>
      </div>
    </div>
  );
}
