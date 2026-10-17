"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAccount, usePublicClient } from "wagmi";
import { parseAbiItem, zeroAddress } from "viem";
import { POAP_FACTORY_ADDRESS, POAP_FACTORY_DEPLOY_TX } from "../constants";

const eventPoapAbi = [
  { type: "function", name: "tokenURI", stateMutability: "view", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ type: "string" }] },
];

const eventCreatedEvent = parseAbiItem(
  "event EventPOAPCreated(address indexed creator, address indexed poap, address indexed minter, string name, string symbol, string metadataURI)"
);
const transferEvent = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
);

const EXPLORER = "https://scan.bohr.life";
const DEFAULT_IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

function ipfsToHttp(uri) {
  if (!uri) return "";
  if (uri.startsWith("ipfs://")) {
    const gateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY || DEFAULT_IPFS_GATEWAY;
    const normalized = gateway.endsWith("/") ? gateway : `${gateway}/`;
    return `${normalized}${uri.slice("ipfs://".length)}`;
  }
  return uri;
}

export default function Events() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [mounted, setMounted] = useState(false);
  const [poaps, setPoaps] = useState([]);
  const [collectionCount, setCollectionCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => setMounted(true), []);

  const loadPoaps = useCallback(async () => {
    if (!publicClient || !address || !POAP_FACTORY_ADDRESS) {
      setPoaps([]);
      setCollectionCount(0);
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Derive the factory deployment block from its public deployment transaction.
      // This keeps the log query narrow instead of scanning Bohr from genesis.
      const factoryReceipt = await publicClient.getTransactionReceipt({ hash: POAP_FACTORY_DEPLOY_TX });
      const createdLogs = await publicClient.getLogs({
        address: POAP_FACTORY_ADDRESS,
        event: eventCreatedEvent,
        fromBlock: factoryReceipt.blockNumber,
        toBlock: "latest",
      });

      setCollectionCount(createdLogs.length);

      const claimed = [];
      for (const log of createdLogs) {
        const collection = log.args.poap;
        if (!collection) continue;

        // EventPOAP is soulbound and has no burn function, so a mint Transfer
        // from zeroAddress to this wallet is permanent proof of current ownership.
        const mintLogs = await publicClient.getLogs({
          address: collection,
          event: transferEvent,
          args: { from: zeroAddress, to: address },
          fromBlock: log.blockNumber,
          toBlock: "latest",
        });

        for (const mintLog of mintLogs) {
          if (mintLog.args.tokenId === undefined) continue;
          claimed.push({
            collection,
            tokenId: mintLog.args.tokenId,
            name: log.args.name || "Attendance credential",
            symbol: log.args.symbol || "POAP",
            factoryMetadataURI: log.args.metadataURI || "",
            claimedBlock: mintLog.blockNumber,
          });
        }
      }

      const hydrated = await Promise.all(
        claimed.map(async (item) => {
          let tokenURI = item.factoryMetadataURI;
          try {
            tokenURI = await publicClient.readContract({
              address: item.collection,
              abi: eventPoapAbi,
              functionName: "tokenURI",
              args: [item.tokenId],
            });
          } catch {
            // Factory metadata URI is an immutable creation-time fallback.
          }

          const metadataURL = ipfsToHttp(String(tokenURI || ""));
          let metadata = null;
          let metadataError = "";

          if (metadataURL) {
            try {
              const response = await fetch(metadataURL, { cache: "no-store" });
              if (!response.ok) throw new Error(`IPFS gateway returned HTTP ${response.status}`);
              metadata = await response.json();
            } catch (fetchError) {
              metadataError = fetchError instanceof Error ? fetchError.message : "Unable to fetch metadata";
            }
          }

          return {
            ...item,
            tokenURI,
            metadata,
            metadataError,
            imageURL: ipfsToHttp(metadata?.image || ""),
          };
        })
      );

      hydrated.sort((a, b) => Number(b.claimedBlock - a.claimedBlock));
      setPoaps(hydrated);
    } catch (loadError) {
      setPoaps([]);
      setError(loadError instanceof Error ? loadError.message : "Unable to load POAP history");
    } finally {
      setLoading(false);
    }
  }, [publicClient, address]);

  useEffect(() => {
    if (mounted) void loadPoaps();
  }, [mounted, loadPoaps]);

  return (
    <main className="pb-20 pt-12">
      <div className="people-shell">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="people-kicker">Attendance history</p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">My POAPs</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Every PEOPLE attendance credential ever claimed by your connected wallet. Changing the active event never removes older POAPs from this history.</p>
          </div>
          <button type="button" onClick={loadPoaps} disabled={loading || !mounted || !isConnected} className="people-button-secondary self-start sm:self-auto">
            <span className={`material-symbols-outlined text-lg ${loading ? "animate-spin" : ""}`}>refresh</span>{loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {mounted && isConnected && (
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <span className="people-status"><span className="material-symbols-outlined text-base text-primary">verified</span>{poaps.length} owned</span>
            <span className="people-status">{collectionCount} PEOPLE event{collectionCount === 1 ? "" : "s"} discovered</span>
          </div>
        )}

        {!POAP_FACTORY_ADDRESS && <StateCard icon="warning" title="Factory not configured" body="The Bohr PEOPLE factory address is missing from the frontend environment." />}
        {mounted && POAP_FACTORY_ADDRESS && !isConnected && <StateCard icon="account_balance_wallet" title="Connect your wallet" body="Your complete PEOPLE attendance history will appear here after you connect the wallet that claimed the credentials." />}
        {error && <StateCard icon="error" title="Could not load your POAP history" body={error} danger />}
        {loading && <StateCard icon="progress_activity" title="Reading attendance history" body="Discovering PEOPLE event collections on Bohr and resolving your claimed NFT metadata from IPFS…" spinning />}
        {mounted && !loading && isConnected && !error && poaps.length === 0 && <StateCard icon="wallet" title="No attendance NFTs yet" body="Claim a PEOPLE POAP at a participating event and it will appear here permanently." action={<Link href="/claim" className="people-button-primary">Claim a POAP</Link>} />}

        {mounted && !loading && poaps.length > 0 && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {poaps.map((poap) => (
              <article key={`${poap.collection}-${poap.tokenId.toString()}`} className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-surface-low shadow-panel transition hover:-translate-y-1 hover:border-violet-500/35">
                <div className="relative aspect-square overflow-hidden bg-surface-card">
                  {poap.imageURL ? <img src={poap.imageURL} alt={poap.metadata?.name ? `${poap.metadata.name} artwork` : "POAP artwork"} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"/> : <div className="grid h-full place-items-center p-8 text-center text-sm text-slate-500">{poap.metadataError ? "Artwork could not be resolved from the IPFS gateway." : "No artwork found in the event metadata."}</div>}
                  <div className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/55 px-3 py-1 text-xs font-bold text-white backdrop-blur">#{poap.tokenId.toString()}</div>
                  <div className="absolute bottom-4 left-4 rounded-full border border-violet-500/30 bg-violet-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-200 backdrop-blur">Soulbound</div>
                </div>
                <div className="p-5">
                  <h2 className="text-lg font-bold text-white">{poap.metadata?.name || poap.name}</h2>
                  {poap.metadata?.description && <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-400">{poap.metadata.description}</p>}
                  {poap.metadataError && <p className="mt-3 rounded-lg border border-amber-400/20 bg-amber-500/10 p-3 text-xs text-amber-200">Metadata gateway error: {poap.metadataError}</p>}
                  <a href={`${EXPLORER}/token/${poap.collection}/instance/${poap.tokenId.toString()}`} target="_blank" rel="noreferrer" className="people-button-secondary mt-5 w-full">View NFT on Bohr Explorer <span className="material-symbols-outlined text-base">open_in_new</span></a>
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
