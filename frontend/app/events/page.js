"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAccount, usePublicClient, useReadContract } from "wagmi";
import { zeroAddress } from "viem";
import { POAP_DAPP_ADDRESS, poapDappAbi } from "../constants";

const eventPoapAbi = [
  {
    type: "function",
    name: "name",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
  {
    type: "function",
    name: "nextTokenId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ type: "address" }],
  },
  {
    type: "function",
    name: "tokenURI",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ type: "string" }],
  },
];

const EXPLORER = "https://scan.bohr.life";
const DEFAULT_IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/";
const MAX_SCAN = 5000;
const RPC_BATCH = 25;

function ipfsToHttp(uri) {
  if (!uri) return "";
  if (uri.startsWith("ipfs://")) {
    const gateway =
      process.env.NEXT_PUBLIC_IPFS_GATEWAY || DEFAULT_IPFS_GATEWAY;
    const normalizedGateway = gateway.endsWith("/") ? gateway : `${gateway}/`;
    return `${normalizedGateway}${uri.slice("ipfs://".length)}`;
  }
  return uri;
}

function shortAddress(value) {
  if (!value) return "";
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

async function readContractsWithoutMulticall(publicClient, calls) {
  const results = [];

  for (let i = 0; i < calls.length; i += RPC_BATCH) {
    const batch = calls.slice(i, i + RPC_BATCH);

    const batchResults = await Promise.all(
      batch.map(async (call) => {
        try {
          const result = await publicClient.readContract(call);
          return { status: "success", result };
        } catch (error) {
          return { status: "failure", error };
        }
      })
    );

    results.push(...batchResults);
  }

  return results;
}

export default function Events() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [poaps, setPoaps] = useState([]);
  const [collectionInfo, setCollectionInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { data: currentNft, isLoading: nftLoading } = useReadContract({
    address: POAP_DAPP_ADDRESS,
    abi: poapDappAbi,
    functionName: "poapNftContract",
    query: { enabled: Boolean(POAP_DAPP_ADDRESS) },
  });

  const activeNft = useMemo(() => {
    if (!currentNft || currentNft === zeroAddress) return null;
    return currentNft;
  }, [currentNft]);

  const loadPoaps = useCallback(async () => {
    if (!publicClient || !address || !activeNft) {
      setPoaps([]);
      setCollectionInfo(null);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [name, symbol, nextTokenId] = await Promise.all([
        publicClient.readContract({
          address: activeNft,
          abi: eventPoapAbi,
          functionName: "name",
        }),
        publicClient.readContract({
          address: activeNft,
          abi: eventPoapAbi,
          functionName: "symbol",
        }),
        publicClient.readContract({
          address: activeNft,
          abi: eventPoapAbi,
          functionName: "nextTokenId",
        }),
      ]);

      const mintedCount = Number(nextTokenId);
      setCollectionInfo({ name, symbol, mintedCount });

      if (mintedCount === 0) {
        setPoaps([]);
        return;
      }

      if (mintedCount > MAX_SCAN) {
        throw new Error(
          `This collection has ${mintedCount.toLocaleString()} tokens. The pilot gallery scans up to ${MAX_SCAN.toLocaleString()} tokens; add an indexer before using it for a collection this large.`
        );
      }

      // EventPOAP has sequential token IDs and no burn function, so every ID in
      // [0, nextTokenId) exists. We can discover ownership without ERC721Enumerable.
      const ownerCalls = Array.from({ length: mintedCount }, (_, index) => ({
        address: activeNft,
        abi: eventPoapAbi,
        functionName: "ownerOf",
        args: [BigInt(index)],
      }));

      const ownerResults = await readContractsWithoutMulticall(publicClient, ownerCalls);
      const wallet = address.toLowerCase();
      const ownedTokenIds = ownerResults.flatMap((result, index) => {
        if (
          result.status === "success" &&
          String(result.result).toLowerCase() === wallet
        ) {
          return [BigInt(index)];
        }
        return [];
      });

      if (ownedTokenIds.length === 0) {
        setPoaps([]);
        return;
      }

      const uriResults = await readContractsWithoutMulticall(
        publicClient,
        ownedTokenIds.map((tokenId) => ({
          address: activeNft,
          abi: eventPoapAbi,
          functionName: "tokenURI",
          args: [tokenId],
        }))
      );

      const hydrated = await Promise.all(
        ownedTokenIds.map(async (tokenId, index) => {
          const uriResult = uriResults[index];
          const tokenURI =
            uriResult?.status === "success" ? String(uriResult.result) : "";
          const metadataURL = ipfsToHttp(tokenURI);

          let metadata = null;
          let metadataError = "";

          if (metadataURL) {
            try {
              const response = await fetch(metadataURL, { cache: "no-store" });
              if (!response.ok) {
                throw new Error(`IPFS gateway returned HTTP ${response.status}`);
              }
              metadata = await response.json();
            } catch (fetchError) {
              metadataError =
                fetchError instanceof Error
                  ? fetchError.message
                  : "Unable to fetch metadata";
            }
          }

          return {
            tokenId,
            tokenURI,
            metadataURL,
            metadata,
            metadataError,
            imageURL: ipfsToHttp(metadata?.image || ""),
          };
        })
      );

      setPoaps(hydrated);
    } catch (loadError) {
      setPoaps([]);
      setError(
        loadError instanceof Error ? loadError.message : "Unable to load POAPs"
      );
    } finally {
      setLoading(false);
    }
  }, [publicClient, address, activeNft]);

  useEffect(() => {
    loadPoaps();
  }, [loadPoaps]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-950 via-purple-900 to-purple-800 text-white px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-purple-300">
              PEOPLE Attendance
            </p>
            <h1 className="text-3xl font-bold sm:text-4xl">My POAPs</h1>
            <p className="mt-3 max-w-2xl text-purple-200">
              View attendance NFTs owned by your connected wallet and verify the
              metadata and artwork stored on IPFS.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/"
              className="rounded-full border border-purple-300/30 bg-white/10 px-4 py-2 text-sm font-medium transition hover:bg-white/20"
            >
              Home
            </Link>
            <button
              type="button"
              onClick={loadPoaps}
              disabled={loading || !isConnected}
              className="rounded-full bg-purple-500 px-4 py-2 text-sm font-semibold transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </header>

        <section className="mb-6 grid gap-4 rounded-2xl border border-purple-300/20 bg-white/10 p-5 backdrop-blur md:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-purple-300">
              Connected wallet
            </p>
            <p className="mt-1 break-all font-medium">
              {address || "Connect a wallet to view your POAPs"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-purple-300">
              Active collection
            </p>
            <p className="mt-1 break-all font-medium">
              {activeNft || (nftLoading ? "Loading…" : "Not configured")}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-purple-300">
              Collection
            </p>
            <p className="mt-1 font-medium">
              {collectionInfo
                ? `${collectionInfo.name} (${collectionInfo.symbol}) · ${collectionInfo.mintedCount} minted`
                : "—"}
            </p>
          </div>
        </section>

        {!POAP_DAPP_ADDRESS && (
          <div className="rounded-2xl border border-amber-300/30 bg-amber-500/10 p-5 text-amber-100">
            NEXT_PUBLIC_POAP_DAPP_ADDRESS is not configured.
          </div>
        )}

        {POAP_DAPP_ADDRESS && !isConnected && (
          <div className="rounded-2xl border border-purple-300/20 bg-white/10 p-8 text-center text-purple-100">
            Connect your wallet from the navigation to see the POAPs it owns.
          </div>
        )}

        {isConnected && !nftLoading && !activeNft && (
          <div className="rounded-2xl border border-purple-300/20 bg-white/10 p-8 text-center text-purple-100">
            No attendance NFT collection is currently active in PEOPLE.
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-300/30 bg-red-500/10 p-5 text-red-100">
            <p className="font-semibold">Could not load your POAPs</p>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        )}

        {loading && (
          <div className="rounded-2xl border border-purple-300/20 bg-white/10 p-8 text-center text-purple-100">
            Reading your attendance NFT from Bohr and resolving IPFS metadata…
          </div>
        )}

        {!loading && isConnected && activeNft && !error && poaps.length === 0 && (
          <div className="rounded-2xl border border-purple-300/20 bg-white/10 p-8 text-center">
            <h2 className="text-xl font-semibold">No POAP found for this wallet</h2>
            <p className="mt-2 text-purple-200">
              If you just claimed, wait for the transaction to confirm and press
              Refresh.
            </p>
          </div>
        )}

        {!loading && poaps.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {poaps.map((poap) => (
              <article
                key={poap.tokenId.toString()}
                className="overflow-hidden rounded-3xl border border-purple-300/20 bg-white/10 shadow-xl backdrop-blur"
              >
                <div className="aspect-square bg-purple-950/50">
                  {poap.imageURL ? (
                    <img
                      src={poap.imageURL}
                      alt={
                        poap.metadata?.name
                          ? `${poap.metadata.name} artwork`
                          : "POAP artwork"
                      }
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-6 text-center text-purple-300">
                      {poap.metadataError
                        ? "Metadata loaded with an error; artwork unavailable"
                        : "No image URI in metadata"}
                    </div>
                  )}
                </div>

                <div className="space-y-4 p-5">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-xl font-bold">
                        {poap.metadata?.name || collectionInfo?.name || "Attendance POAP"}
                      </h2>
                      <span className="shrink-0 rounded-full bg-purple-500/30 px-3 py-1 text-xs font-semibold text-purple-100">
                        #{poap.tokenId.toString()}
                      </span>
                    </div>
                    {poap.metadata?.description && (
                      <p className="mt-2 text-sm leading-6 text-purple-200">
                        {poap.metadata.description}
                      </p>
                    )}
                  </div>

                  {poap.metadataError && (
                    <div className="rounded-xl border border-amber-300/30 bg-amber-500/10 p-3 text-xs text-amber-100">
                      Metadata gateway error: {poap.metadataError}
                    </div>
                  )}

                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="text-purple-300">Collection</dt>
                      <dd className="mt-1 break-all font-mono text-xs">
                        {activeNft}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-purple-300">tokenURI</dt>
                      <dd className="mt-1 break-all font-mono text-xs">
                        {poap.tokenURI || "Unavailable"}
                      </dd>
                    </div>
                    {poap.metadata?.image && (
                      <div>
                        <dt className="text-purple-300">Image URI</dt>
                        <dd className="mt-1 break-all font-mono text-xs">
                          {poap.metadata.image}
                        </dd>
                      </div>
                    )}
                  </dl>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {poap.metadataURL && (
                      <a
                        href={poap.metadataURL}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full bg-purple-500 px-3 py-2 text-xs font-semibold transition hover:bg-purple-400"
                      >
                        View raw metadata
                      </a>
                    )}
                    {poap.imageURL && (
                      <a
                        href={poap.imageURL}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-purple-300/30 bg-white/10 px-3 py-2 text-xs font-semibold transition hover:bg-white/20"
                      >
                        Open IPFS image
                      </a>
                    )}
                    <a
                      href={`${EXPLORER}/token/${activeNft}/instance/${poap.tokenId.toString()}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-purple-300/30 bg-white/10 px-3 py-2 text-xs font-semibold transition hover:bg-white/20"
                    >
                      View token on Bohr
                    </a>
                    <a
                      href={`${EXPLORER}/address/${activeNft}`}
                      target="_blank"
                      rel="noreferrer"
                      title={activeNft}
                      className="rounded-full border border-purple-300/30 bg-white/10 px-3 py-2 text-xs font-semibold transition hover:bg-white/20"
                    >
                      Collection {shortAddress(activeNft)}
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
