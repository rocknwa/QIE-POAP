"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { keccak256, toBytes, zeroAddress, zeroHash } from "viem";
import { POAP_DAPP_ADDRESS, poapDappAbi } from "../constants";

function friendlyError(message: string) {
  if (message.includes("MintingDisabled")) return "Claims are currently disabled for this event.";
  if (message.includes("InvalidCode")) return "That event code is not valid.";
  if (message.includes("MintingExpired")) return "The claim period for this event has ended.";
  if (message.includes("AlreadyMinted")) return "This wallet already claimed the attendance credential.";
  if (message.includes("User rejected") || message.includes("rejected the request")) return "The transaction was cancelled in your wallet.";
  return "The claim could not be completed. Please check the code and try again.";
}

export default function ClaimContent() {
  const [code, setCode] = useState("");
  const [uiError, setUiError] = useState("");
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const { data: hash, isPending, writeContractAsync } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash, confirmations: 1 });

  useEffect(() => setMounted(true), []);

  const { data: activeNft } = useReadContract({ address: POAP_DAPP_ADDRESS!, abi: poapDappAbi, functionName: "poapNftContract", query: { enabled: Boolean(POAP_DAPP_ADDRESS) } });
  const { data: deadline } = useReadContract({ address: POAP_DAPP_ADDRESS!, abi: poapDappAbi, functionName: "claimDeadline", query: { enabled: Boolean(POAP_DAPP_ADDRESS) } });
  const { data: currentCodeHash, isLoading: codeHashLoading } = useReadContract({ address: POAP_DAPP_ADDRESS!, abi: poapDappAbi, functionName: "codeHash", query: { enabled: Boolean(POAP_DAPP_ADDRESS) } });
  const { data: claimed, refetch: refetchClaimed } = useReadContract({
    address: POAP_DAPP_ADDRESS!,
    abi: poapDappAbi,
    functionName: "hasClaimed",
    args: activeNft && activeNft !== zeroAddress && address ? [activeNft, address] : undefined,
    query: { enabled: Boolean(POAP_DAPP_ADDRESS && address && activeNft && activeNft !== zeroAddress) },
  });

  const eventActive = Boolean(activeNft && activeNft !== zeroAddress);
  const deadlineDate = useMemo(() => deadline && deadline > BigInt(0) ? new Date(Number(deadline) * 1000) : null, [deadline]);
  const expired = Boolean(deadlineDate && deadlineDate.getTime() <= Date.now());

  useEffect(() => {
    if (isSuccess) void refetchClaimed();
  }, [isSuccess, refetchClaimed]);

  if (!mounted) {
    return <main className="people-shell py-20"><div className="h-[520px] animate-pulse rounded-2xl bg-white/[0.03]" /></main>;
  }

  async function claim() {
    setUiError("");
    if (!isConnected) return setUiError("Connect the wallet that should receive the attendance credential.");
    if (!POAP_DAPP_ADDRESS) return setUiError("The Bohr claim contract is not configured.");
    if (!eventActive) return setUiError("There is no active event to claim right now.");
    if (expired) return setUiError("The claim period for this event has ended.");
    if (claimed) return setUiError("This wallet already claimed the attendance credential.");
    if (!code.trim()) return setUiError("Enter the event claim code.");
    if (codeHashLoading || !currentCodeHash) return setUiError("Claim settings are still loading. Try again in a moment.");
    if (currentCodeHash === zeroHash) return setUiError("This event does not have a claim code configured yet.");

    // UX preflight only: the contract still performs the authoritative check.
    // This avoids opening the wallet for an obviously wrong code.
    const submittedCodeHash = keccak256(toBytes(code.trim()));
    if (submittedCodeHash.toLowerCase() !== String(currentCodeHash).toLowerCase()) {
      return setUiError("That event code is not valid. Check the code and try again.");
    }

    try {
      await writeContractAsync({
        address: POAP_DAPP_ADDRESS,
        abi: poapDappAbi,
        functionName: "mint",
        args: [code.trim()],
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      setUiError(friendlyError(msg));
    }
  }

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[34rem] w-[52rem] -translate-x-1/2 rounded-full bg-violet/15 blur-[120px]" />
      <div className="people-shell relative grid gap-10 py-14 lg:grid-cols-[.85fr_1.15fr] lg:items-center lg:py-20">
        <section>
          <p className="people-kicker">Attendee claim</p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-[-0.03em] text-white sm:text-5xl">Claim your proof of attendance.</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-400">Connect the wallet you used at the event, enter the organizer-provided code and mint a non-transferable credential directly to your wallet.</p>
          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-3 text-sm text-slate-400"><span className="grid h-8 w-8 place-items-center rounded-lg bg-violet/10 text-primary"><span className="material-symbols-outlined text-lg">lock</span></span> The credential cannot be transferred after minting.</div>
            <div className="flex items-center gap-3 text-sm text-slate-400"><span className="grid h-8 w-8 place-items-center rounded-lg bg-violet/10 text-primary"><span className="material-symbols-outlined text-lg">verified</span></span> Each wallet can claim once per event collection.</div>
            <div className="flex items-center gap-3 text-sm text-slate-400"><span className="grid h-8 w-8 place-items-center rounded-lg bg-violet/10 text-primary"><span className="material-symbols-outlined text-lg">public</span></span> Claims are verified on Bohr Testnet, chain 968.</div>
          </div>
        </section>

        <section className="people-card-elevated mx-auto w-full max-w-xl p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4 border-b border-white/[0.07] pb-5">
            <div><p className="people-kicker">Current event</p><h2 className="mt-2 text-xl font-bold text-white">PEOPLE attendance credential</h2></div>
            <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${eventActive && !expired ? "border border-success/20 bg-success/10 text-success" : "border border-white/10 bg-white/[0.04] text-slate-400"}`}>{eventActive ? expired ? "Expired" : "Claiming open" : "Not active"}</span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-black/20 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Network</p><p className="mt-1 text-sm font-semibold text-white">Bohr Testnet · 968</p></div>
            <div className="rounded-xl bg-black/20 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Claim deadline</p><p className="mt-1 text-sm font-semibold text-white">{deadlineDate ? deadlineDate.toLocaleString() : "Not configured"}</p></div>
          </div>

          <div className="mt-6">
            <label className="people-label" htmlFor="claim-code">Event claim code</label>
            <div className="relative"><span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-500">key</span><input id="claim-code" value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && claim()} className="people-input pl-11" placeholder="Enter the code shared at the event" autoComplete="off" /></div>
          </div>

          {mounted && claimed && <div className="mt-4 rounded-xl border border-success/20 bg-success/10 p-4 text-sm text-success">This wallet has already claimed this event.</div>}
          {uiError && <div className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">{uiError}</div>}
          {isSuccess && <div className="mt-4 rounded-xl border border-success/20 bg-success/10 p-4"><p className="font-bold text-success">Attendance verified</p><p className="mt-1 text-sm text-slate-300">Your PEOPLE POAP has been minted to your wallet.</p></div>}

          <button type="button" onClick={claim} disabled={isPending || confirming || codeHashLoading || !eventActive || expired || Boolean(claimed)} className="people-button-primary mt-6 w-full py-3.5">{isPending ? "Confirm in wallet…" : confirming ? "Confirming on Bohr…" : claimed ? "Already claimed" : "Claim POAP"}<span className="material-symbols-outlined text-lg">verified</span></button>
          {isSuccess && <Link href="/events" className="people-button-secondary mt-3 w-full">View My POAPs</Link>}
          <p className="mt-4 text-center text-xs leading-5 text-slate-500">The claim transaction is public. Do not reuse a sensitive password as an event code.</p>
        </section>
      </div>
    </main>
  );
}
