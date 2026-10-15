"use client";

import { FormEvent, useMemo, useState } from "react";
import { useAccount, usePublicClient, useReadContract, useWriteContract } from "wagmi";
import { keccak256, parseEventLogs, toBytes } from "viem";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { poapDappAbi, poapFactoryAbi, POAP_DAPP_ADDRESS, POAP_FACTORY_ADDRESS } from "../constants";

export default function Dashboard() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const [busy, setBusy] = useState(false);
  const [createdNft, setCreatedNft] = useState<`0x${string}` | "">("");
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [claimCode, setClaimCode] = useState("");
  const [deadline, setDeadline] = useState("");

  const enabled = Boolean(POAP_DAPP_ADDRESS && address);
  const { data: owner } = useReadContract({ address: POAP_DAPP_ADDRESS!, abi: poapDappAbi, functionName: "owner", query: { enabled } });
  const { data: admin } = useReadContract({ address: POAP_DAPP_ADDRESS!, abi: poapDappAbi, functionName: "admins", args: address ? [address] : undefined, query: { enabled } });
  const { data: currentNft, refetch: refetchNft } = useReadContract({ address: POAP_DAPP_ADDRESS!, abi: poapDappAbi, functionName: "poapNftContract", query: { enabled: Boolean(POAP_DAPP_ADDRESS) } });
  const { data: currentDeadline, refetch: refetchDeadline } = useReadContract({ address: POAP_DAPP_ADDRESS!, abi: poapDappAbi, functionName: "claimDeadline", query: { enabled: Boolean(POAP_DAPP_ADDRESS) } });

  const canAdmin = Boolean(address && (admin || owner?.toLowerCase() === address.toLowerCase()));
  const deadlineText = useMemo(() => currentDeadline && currentDeadline > 0n ? new Date(Number(currentDeadline) * 1000).toLocaleString() : "Not configured", [currentDeadline]);

  async function createEvent(e: FormEvent) {
    e.preventDefault();
    if (!canAdmin || !POAP_DAPP_ADDRESS || !POAP_FACTORY_ADDRESS || !publicClient) return toast.error("Admin wallet and deployed contracts are required.");
    if (!image || !name.trim() || !symbol.trim() || !description.trim()) return toast.error("Complete the NFT details and artwork.");
    if (symbol.trim().length > 16) return toast.error("Keep the NFT symbol at 16 characters or fewer.");

    setBusy(true);
    try {
      const form = new FormData();
      form.append("image", image);
      form.append("name", name.trim());
      form.append("description", description.trim());
      const upload = await fetch("/api/ipfs/event-metadata", { method: "POST", body: form });
      const uploaded = await upload.json();
      if (!upload.ok) throw new Error(uploaded.error || "Metadata upload failed");

      const hash = await writeContractAsync({
        address: POAP_FACTORY_ADDRESS,
        abi: poapFactoryAbi,
        functionName: "createEventPOAP",
        args: [name.trim(), symbol.trim(), uploaded.metadataURI, POAP_DAPP_ADDRESS],
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const logs = parseEventLogs({ abi: poapFactoryAbi, logs: receipt.logs, eventName: "EventPOAPCreated" });
      const nft = logs[0]?.args.poap;
      if (!nft) throw new Error("Factory event did not contain the NFT address");
      setCreatedNft(nft);
      toast.success("Event NFT created. Activate it below to use it for claims.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create event NFT");
    } finally { setBusy(false); }
  }

  async function activateNft() {
    const nft = createdNft || (currentNft as `0x${string}` | undefined);
    if (!POAP_DAPP_ADDRESS || !nft || !publicClient) return toast.error("Create an NFT first.");
    setBusy(true);
    try {
      const hash = await writeContractAsync({ address: POAP_DAPP_ADDRESS, abi: poapDappAbi, functionName: "updateNFTContract", args: [nft] });
      await publicClient.waitForTransactionReceipt({ hash });
      await refetchNft();
      toast.success("Event NFT activated for claims.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Activation failed"); }
    finally { setBusy(false); }
  }

  async function configureClaim(e: FormEvent) {
    e.preventDefault();
    if (!POAP_DAPP_ADDRESS || !publicClient || !claimCode.trim() || !deadline) return toast.error("Enter a claim code and deadline.");
    const unixDeadline = BigInt(Math.floor(new Date(deadline).getTime() / 1000));
    if (unixDeadline <= BigInt(Math.floor(Date.now() / 1000))) return toast.error("Deadline must be in the future.");
    const hashOfCode = keccak256(toBytes(claimCode.trim()));

    setBusy(true);
    try {
      const hash = await writeContractAsync({ address: POAP_DAPP_ADDRESS, abi: poapDappAbi, functionName: "configureClaim", args: [hashOfCode, unixDeadline] });
      await publicClient.waitForTransactionReceipt({ hash });
      await refetchDeadline();
      setClaimCode("");
      toast.success("Claim code hash and deadline configured. Save the plaintext code securely; it cannot be recovered from the contract.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Claim configuration failed"); }
    finally { setBusy(false); }
  }

  if (!POAP_DAPP_ADDRESS || !POAP_FACTORY_ADDRESS) return <main className="min-h-screen bg-purple-950 text-white p-8">Set NEXT_PUBLIC_POAP_DAPP_ADDRESS and NEXT_PUBLIC_POAP_FACTORY_ADDRESS after the Bohr deployment.</main>;

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-950 to-purple-800 text-white p-4 sm:p-8">
      <ToastContainer />
      <div className="max-w-5xl mx-auto space-y-6">
        <header><h1 className="text-3xl font-bold">PEOPLE Event Admin</h1><p className="text-purple-200 mt-2">Create a soulbound attendance NFT and configure the single-event Bohr claim flow.</p></header>
        <section className="bg-white/10 rounded-2xl p-5 grid md:grid-cols-2 gap-4 text-sm">
          <div><span className="text-purple-300">Wallet</span><p className="break-all">{address || "Not connected"}</p></div>
          <div><span className="text-purple-300">Role</span><p>{canAdmin ? "Owner / Admin" : "User"}</p></div>
          <div><span className="text-purple-300">Active NFT</span><p className="break-all">{String(currentNft || "Not configured")}</p></div>
          <div><span className="text-purple-300">Claim deadline</span><p>{deadlineText}</p></div>
        </section>

        {canAdmin && <>
          <form onSubmit={createEvent} className="bg-white/10 rounded-2xl p-5 space-y-4">
            <h2 className="text-xl font-semibold">1. Create event attendance NFT</h2>
            <div className="grid md:grid-cols-2 gap-4"><input className="p-3 rounded bg-white/10" placeholder="NFT name" value={name} onChange={e=>setName(e.target.value)} maxLength={120}/><input className="p-3 rounded bg-white/10" placeholder="Symbol (e.g. BOTPOAP)" value={symbol} onChange={e=>setSymbol(e.target.value)} maxLength={16}/></div>
            <textarea className="p-3 rounded bg-white/10 w-full min-h-28" placeholder="Event description" value={description} onChange={e=>setDescription(e.target.value)} maxLength={1500}/>
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={e=>setImage(e.target.files?.[0] || null)} />
            <button disabled={busy} className="px-5 py-3 rounded bg-purple-500 disabled:opacity-50">{busy ? "Working…" : "Upload metadata & create NFT"}</button>
            {createdNft && <div className="p-3 rounded bg-green-500/10"><p className="break-all">Created: {createdNft}</p><button type="button" onClick={activateNft} disabled={busy} className="mt-3 px-4 py-2 rounded bg-green-600">Activate for this event</button></div>}
          </form>

          <form onSubmit={configureClaim} className="bg-white/10 rounded-2xl p-5 space-y-4">
            <h2 className="text-xl font-semibold">2. Configure attendance claim</h2>
            <p className="text-sm text-purple-200">Only the hash is stored in contract state. Keep the plaintext code separately. Claim transactions still reveal the submitted code in transaction calldata.</p>
            <input className="p-3 rounded bg-white/10 w-full" type="password" autoComplete="new-password" placeholder="Event claim code" value={claimCode} onChange={e=>setClaimCode(e.target.value)} />
            <input className="p-3 rounded bg-white/10 w-full" type="datetime-local" value={deadline} onChange={e=>setDeadline(e.target.value)} />
            <button disabled={busy} className="px-5 py-3 rounded bg-purple-500 disabled:opacity-50">Configure claim</button>
          </form>
        </>}
      </div>
    </main>
  );
}
