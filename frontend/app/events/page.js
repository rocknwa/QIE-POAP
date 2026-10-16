"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAccount, usePublicClient, useReadContract } from "wagmi";
import { zeroAddress } from "viem";
import { POAP_DAPP_ADDRESS, poapDappAbi } from "../constants";

const eventPoapAbi = [
  { type: "function", name: "name", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "nextTokenId", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "ownerOf", stateMutability: "view", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ type: "address" }] },
  { type: "function", name: "tokenURI", stateMutability: "view", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ type: "string" }] },
];

const EXPLORER = "https://scan.bohr.life";
const DEFAULT_IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/";
const MAX_SCAN = 5000;
const RPC_BATCH = 25;

function ipfsToHttp(uri) {
  if (!uri) return "";
  if (uri.startsWith("ipfs://")) {
    const gateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY || DEFAULT_IPFS_GATEWAY;
    const normalized = gateway.endsWith("/") ? gateway : `${gateway}/`;
    return `${normalized}${uri.slice("ipfs://".length)}`;
  }
  return uri;
}

async function readContractsWithoutMulticall(publicClient, calls) {
  const results = [];
  for (let i = 0; i < calls.length; i += RPC_BATCH) {
    const batch = calls.slice(i, i + RPC_BATCH);
    const batchResults = await Promise.all(batch.map(async (call) => {
      try { return { status: "success", result: await publicClient.readContract(call) }; }
      catch (error) { return { status: "failure", error }; }
    }));
    results.push(...batchResults);
  }
  return results;
}

export default function Events() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [mounted, setMounted] = useState(false);
  const [poaps, setPoaps] = useState([]);
  const [collectionInfo, setCollectionInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => setMounted(true), []);

  const { data: currentNft, isLoading: nftLoading } = useReadContract({
    address: POAP_DAPP_ADDRESS,
    abi: poapDappAbi,
    functionName: "poapNftContract",
    query: { enabled: Boolean(POAP_DAPP_ADDRESS) },
  });

  const activeNft = useMemo(() => (!currentNft || currentNft === zeroAddress ? null : currentNft), [currentNft]);

  const loadPoaps = useCallback(async () => {
    if (!publicClient || !address || !activeNft) { setPoaps([]); setCollectionInfo(null); return; }
    setLoading(true); setError("");
    try {
      const [name, symbol, nextTokenId] = await Promise.all([
        publicClient.readContract({ address: activeNft, abi: eventPoapAbi, functionName: "name" }),
        publicClient.readContract({ address: activeNft, abi: eventPoapAbi, functionName: "symbol" }),
        publicClient.readContract({ address: activeNft, abi: eventPoapAbi, functionName: "nextTokenId" }),
      ]);
      const mintedCount = Number(nextTokenId);
      setCollectionInfo({ name, symbol, mintedCount });
      if (mintedCount === 0) { setPoaps([]); return; }
      if (mintedCount > MAX_SCAN) throw new Error(`This pilot gallery scans up to ${MAX_SCAN.toLocaleString()} tokens. Add an indexer before using it for a larger collection.`);

      const ownerCalls = Array.from({ length: mintedCount }, (_, index) => ({ address: activeNft, abi: eventPoapAbi, functionName: "ownerOf", args: [BigInt(index)] }));
      const ownerResults = await readContractsWithoutMulticall(publicClient, ownerCalls);
      const wallet = address.toLowerCase();
      const ownedTokenIds = ownerResults.flatMap((result, index) => result.status === "success" && String(result.result).toLowerCase() === wallet ? [BigInt(index)] : []);
      if (ownedTokenIds.length === 0) { setPoaps([]); return; }

      const uriResults = await readContractsWithoutMulticall(publicClient, ownedTokenIds.map((tokenId) => ({ address: activeNft, abi: eventPoapAbi, functionName: "tokenURI", args: [tokenId] })));
      const hydrated = await Promise.all(ownedTokenIds.map(async (tokenId, index) => {
        const uriResult = uriResults[index];
        const tokenURI = uriResult?.status === "success" ? String(uriResult.result) : "";
        const metadataURL = ipfsToHttp(tokenURI);
        let metadata = null; let metadataError = "";
        if (metadataURL) {
          try {
            const response = await fetch(metadataURL, { cache: "no-store" });
            if (!response.ok) throw new Error(`IPFS gateway returned HTTP ${response.status}`);
            metadata = await response.json();
          } catch (fetchError) { metadataError = fetchError instanceof Error ? fetchError.message : "Unable to fetch metadata"; }
        }
        return { tokenId, metadata, metadataError, imageURL: ipfsToHttp(metadata?.image || "") };
      }));
      setPoaps(hydrated);
    } catch (loadError) {
      setPoaps([]); setError(loadError instanceof Error ? loadError.message : "Unable to load POAPs");
    } finally { setLoading(false); }
  }, [publicClient, address, activeNft]);

  useEffect(() => { if (mounted) loadPoaps(); }, [mounted, loadPoaps]);

  return (
    <main className="pb-20 pt-12">
      <div className="people-shell">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div><p className="people-kicker">Attendance history</p><h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">My POAPs</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Soulbound attendance credentials owned by your connected wallet.</p></div>
          <button type="button" onClick={loadPoaps} disabled={loading || !mounted || !isConnected} className="people-button-secondary self-start sm:self-auto"><span className={`material-symbols-outlined text-lg ${loading ? "animate-spin" : ""}`}>refresh</span>{loading ? "Refreshing…" : "Refresh"}</button>
        </div>

        {mounted && isConnected && collectionInfo && <div className="mt-8 flex flex-wrap items-center gap-3"><span className="people-status"><span className="material-symbols-outlined text-base text-primary">token</span>{collectionInfo.name}</span><span className="people-status">{poaps.length} owned</span><span className="people-status">{collectionInfo.mintedCount} minted</span></div>}

        {!POAP_DAPP_ADDRESS && <StateCard icon="warning" title="Contract not configured" body="The Bohr PEOPLE contract address is missing from the frontend environment." />}
        {mounted && POAP_DAPP_ADDRESS && !isConnected && <StateCard icon="account_balance_wallet" title="Connect your wallet" body="Your attendance credentials will appear here after you connect the wallet that claimed them." />}
        {mounted && isConnected && !nftLoading && !activeNft && <StateCard icon="event_busy" title="No active event" body="PEOPLE does not currently have an attendance NFT collection configured." />}
        {error && <StateCard icon="error" title="Could not load your POAPs" body={error} danger />}
        {loading && <StateCard icon="progress_activity" title="Reading attendance credentials" body="Checking Bohr ownership and resolving the event metadata from IPFS…" spinning />}
        {mounted && !loading && isConnected && activeNft && !error && poaps.length === 0 && <StateCard icon="wallet" title="No attendance NFTs yet" body="Claim a PEOPLE POAP at a participating event and it will appear here." action={<Link href="/claim" className="people-button-primary">Claim a POAP</Link>} />}

        {mounted && !loading && poaps.length > 0 && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {poaps.map((poap) => (
              <article key={poap.tokenId.toString()} className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-surface-low/80 shadow-panel transition hover:-translate-y-1 hover:border-violet/35 hover:shadow-violet">
                <div className="relative aspect-square overflow-hidden bg-surface-card">
                  {poap.imageURL ? <img src={poap.imageURL} alt={poap.metadata?.name ? `${poap.metadata.name} artwork` : "POAP artwork"} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"/> : <div className="grid h-full place-items-center p-8 text-center text-sm text-slate-500">{poap.metadataError ? "Artwork could not be resolved from the IPFS gateway." : "No artwork found in the event metadata."}</div>}
                  <div className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/55 px-3 py-1 text-xs font-bold text-white backdrop-blur">#{poap.tokenId.toString()}</div>
                  <div className="absolute bottom-4 left-4 rounded-full border border-violet/30 bg-violet/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary backdrop-blur">Soulbound</div>
                </div>
                <div className="p-5">
                  <h2 className="text-lg font-bold text-white">{poap.metadata?.name || collectionInfo?.name || "Attendance credential"}</h2>
                  {poap.metadata?.description && <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-400">{poap.metadata.description}</p>}
                  {poap.metadataError && <p className="mt-3 rounded-lg border border-amber-400/20 bg-amber-500/10 p-3 text-xs text-amber-200">Metadata gateway error: {poap.metadataError}</p>}
                  <a href={`${EXPLORER}/token/${activeNft}/instance/${poap.tokenId.toString()}`} target="_blank" rel="noreferrer" className="people-button-secondary mt-5 w-full">View NFT on Bohr Explorer <span className="material-symbols-outlined text-base">open_in_new</span></a>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function StateCard({ icon, title, body, action, danger = false, spinning = false }) {
  return <div className={`mt-8 people-card p-8 text-center ${danger ? "border-red-400/20" : ""}`}><span className={`material-symbols-outlined text-4xl ${danger ? "text-red-300" : "text-primary"} ${spinning ? "animate-spin" : ""}`}>{icon}</span><h2 className="mt-4 text-xl font-bold text-white">{title}</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-400">{body}</p>{action && <div className="mt-5">{action}</div>}</div>;
}
