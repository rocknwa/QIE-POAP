"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAccount, usePublicClient, useReadContract, useWriteContract } from "wagmi";
import { keccak256, parseEventLogs, toBytes, zeroAddress } from "viem";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { poapDappAbi, poapFactoryAbi, POAP_DAPP_ADDRESS, POAP_FACTORY_ADDRESS } from "../constants";

function shortAddress(value?: string) {
  if (!value) return "—";
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [createdNft, setCreatedNft] = useState<`0x${string}` | "">("");
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [claimCode, setClaimCode] = useState("");
  const [deadline, setDeadline] = useState("");

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!image) { setPreview(""); return; }
    const url = URL.createObjectURL(image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const dappEnabled = Boolean(POAP_DAPP_ADDRESS && address);
  const factoryEnabled = Boolean(POAP_FACTORY_ADDRESS && address);
  const { data: owner } = useReadContract({ address: POAP_DAPP_ADDRESS!, abi: poapDappAbi, functionName: "owner", query: { enabled: dappEnabled } });
  const { data: admin } = useReadContract({ address: POAP_DAPP_ADDRESS!, abi: poapDappAbi, functionName: "admins", args: address ? [address] : undefined, query: { enabled: dappEnabled } });
  const { data: factoryOwner } = useReadContract({ address: POAP_FACTORY_ADDRESS!, abi: poapFactoryAbi, functionName: "owner", query: { enabled: factoryEnabled } });
  const { data: factoryAdmin } = useReadContract({ address: POAP_FACTORY_ADDRESS!, abi: poapFactoryAbi, functionName: "admins", args: address ? [address] : undefined, query: { enabled: factoryEnabled } });
  const { data: currentNft, refetch: refetchNft } = useReadContract({ address: POAP_DAPP_ADDRESS!, abi: poapDappAbi, functionName: "poapNftContract", query: { enabled: Boolean(POAP_DAPP_ADDRESS) } });
  const { data: currentDeadline, refetch: refetchDeadline } = useReadContract({ address: POAP_DAPP_ADDRESS!, abi: poapDappAbi, functionName: "claimDeadline", query: { enabled: Boolean(POAP_DAPP_ADDRESS) } });

  const canConfigure = Boolean(address && (admin || owner?.toLowerCase() === address.toLowerCase()));
  const canCreate = Boolean(address && (factoryAdmin || factoryOwner?.toLowerCase() === address.toLowerCase()));
  const canAdmin = canConfigure || canCreate;
  const activeConfigured = Boolean(currentNft && currentNft !== zeroAddress);
  const deadlineText = useMemo(() => currentDeadline && currentDeadline > BigInt(0) ? new Date(Number(currentDeadline) * 1000).toLocaleString() : "Not configured", [currentDeadline]);
  const deadlineExpired = Boolean(currentDeadline && currentDeadline > BigInt(0) && Number(currentDeadline) * 1000 <= Date.now());

  async function createEvent(e: FormEvent) {
    e.preventDefault();
    if (!canCreate || !POAP_DAPP_ADDRESS || !POAP_FACTORY_ADDRESS || !publicClient) return toast.error("Your wallet does not have factory admin access.");
    if (!image || !name.trim() || !symbol.trim() || !description.trim()) return toast.error("Complete the event details and artwork.");
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

      const hash = await writeContractAsync({ address: POAP_FACTORY_ADDRESS, abi: poapFactoryAbi, functionName: "createEventPOAP", args: [name.trim(), symbol.trim(), uploaded.metadataURI, POAP_DAPP_ADDRESS] });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const logs = parseEventLogs({ abi: poapFactoryAbi, logs: receipt.logs, eventName: "EventPOAPCreated" });
      const nft = logs[0]?.args.poap;
      if (!nft) throw new Error("Factory event did not contain the NFT address");
      setCreatedNft(nft);
      toast.success("Event credential created. Activate it when you are ready to accept claims.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create event NFT");
    } finally { setBusy(false); }
  }

  async function activateNft() {
    if (!canConfigure || !POAP_DAPP_ADDRESS || !createdNft || !publicClient) return toast.error("Create an NFT and use an authorized controller admin wallet.");
    setBusy(true);
    try {
      const hash = await writeContractAsync({ address: POAP_DAPP_ADDRESS, abi: poapDappAbi, functionName: "updateNFTContract", args: [createdNft] });
      await publicClient.waitForTransactionReceipt({ hash });
      await refetchNft();
      toast.success("Event credential activated for claims.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Activation failed"); }
    finally { setBusy(false); }
  }

  async function configureClaim(e: FormEvent) {
    e.preventDefault();
    if (!canConfigure || !POAP_DAPP_ADDRESS || !publicClient || !claimCode.trim() || !deadline) return toast.error("Enter a claim code and future deadline using an authorized admin wallet.");
    const unixDeadline = BigInt(Math.floor(new Date(deadline).getTime() / 1000));
    if (unixDeadline <= BigInt(Math.floor(Date.now() / 1000))) return toast.error("Deadline must be in the future.");
    const hashOfCode = keccak256(toBytes(claimCode.trim()));

    setBusy(true);
    try {
      const hash = await writeContractAsync({ address: POAP_DAPP_ADDRESS, abi: poapDappAbi, functionName: "configureClaim", args: [hashOfCode, unixDeadline] });
      await publicClient.waitForTransactionReceipt({ hash });
      await refetchDeadline();
      setClaimCode("");
      toast.success("Claim code hash and deadline configured. Keep the plaintext event code securely.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Claim configuration failed"); }
    finally { setBusy(false); }
  }

  async function stopMinting() {
    if (!canConfigure || !POAP_DAPP_ADDRESS || !publicClient) return;
    if (!window.confirm("Stop claims for the active event? The NFT can be reconfigured later by an admin.")) return;
    setBusy(true);
    try {
      const hash = await writeContractAsync({ address: POAP_DAPP_ADDRESS, abi: poapDappAbi, functionName: "stopMinting" });
      await publicClient.waitForTransactionReceipt({ hash });
      await refetchNft();
      toast.success("Minting stopped.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to stop minting"); }
    finally { setBusy(false); }
  }

  if (!POAP_DAPP_ADDRESS || !POAP_FACTORY_ADDRESS) return <main className="people-shell py-20"><div className="people-card p-8 text-white">Configure the deployed Bohr contract addresses in the frontend environment before opening the dashboard.</div></main>;

  if (!mounted) return <main className="people-shell py-20"><div className="h-72 animate-pulse rounded-2xl bg-white/[0.03]" /></main>;

  if (!isConnected) return <main className="people-shell py-20"><div className="mx-auto max-w-xl people-card p-8 text-center"><span className="material-symbols-outlined text-4xl text-primary">account_balance_wallet</span><h1 className="mt-4 text-2xl font-bold text-white">Connect an organizer wallet</h1><p className="mt-3 text-sm leading-6 text-slate-400">The dashboard only exposes event creation and claim controls to authorized owner/admin wallets.</p></div></main>;

  if (!canAdmin) return <main className="people-shell py-20"><div className="mx-auto max-w-xl people-card p-8 text-center"><span className="material-symbols-outlined text-4xl text-red-300">lock_person</span><h1 className="mt-4 text-2xl font-bold text-white">You don’t have organizer access.</h1><p className="mt-3 text-sm leading-6 text-slate-400">This wallet is not an owner or approved admin for the PEOPLE contracts.</p></div></main>;

  return (
    <main className="pb-20 pt-10">
      <ToastContainer theme="dark" />
      <div className="people-shell">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div><p className="people-kicker">Organizer workspace</p><h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Organizer Dashboard</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Create the event credential, activate it for claims and manage the current attendance window.</p></div>
          <div className="people-status"><span className="h-2 w-2 rounded-full bg-success" /> Bohr Testnet · Chain 968</div>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric label="Active event" value={activeConfigured ? "Configured" : "Not configured"} icon="event_available" tone={activeConfigured ? "success" : "muted"} />
          <Metric label="NFT collection" value={activeConfigured ? shortAddress(String(currentNft)) : "—"} icon="token" />
          <Metric label="Claim deadline" value={deadlineExpired ? "Expired" : deadlineText} icon="schedule" tone={deadlineExpired ? "danger" : "default"} />
          <Metric label="Your role" value={`${canCreate ? "Factory admin" : ""}${canCreate && canConfigure ? " · " : ""}${canConfigure ? "Claim admin" : ""}`} icon="admin_panel_settings" />
        </section>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
          <form onSubmit={createEvent} className="people-card p-6 sm:p-7">
            <div className="flex items-start justify-between gap-4"><div><p className="people-kicker">Step 1</p><h2 className="mt-2 text-xl font-bold text-white">Create event attendance NFT</h2><p className="mt-2 text-sm leading-6 text-slate-400">Artwork and metadata are uploaded to IPFS through the server-side Pinata integration before the factory deploys the soulbound collection.</p></div><span className="material-symbols-outlined text-2xl text-primary">auto_awesome</span></div>

            <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_180px]">
              <div><label className="people-label">Event / NFT name</label><input className="people-input" placeholder="PEOPLE Bohr Pilot Attendance" value={name} onChange={e=>setName(e.target.value)} maxLength={120}/></div>
              <div><label className="people-label">Symbol</label><input className="people-input uppercase" placeholder="PEOPLE" value={symbol} onChange={e=>setSymbol(e.target.value)} maxLength={16}/></div>
            </div>
            <div className="mt-4"><label className="people-label">Description</label><textarea className="people-input min-h-28 resize-y" placeholder="Describe what this attendance credential verifies." value={description} onChange={e=>setDescription(e.target.value)} maxLength={1500}/></div>

            <div className="mt-4"><label className="people-label">Event artwork</label><label className="group grid cursor-pointer gap-4 rounded-2xl border border-dashed border-white/15 bg-black/20 p-4 transition hover:border-violet/60 hover:bg-violet/[0.04] sm:grid-cols-[120px_1fr] sm:items-center">
              <div className="aspect-square overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">{preview ? <img src={preview} alt="Event artwork preview" className="h-full w-full object-cover"/> : <div className="grid h-full place-items-center text-slate-600"><span className="material-symbols-outlined text-4xl">add_photo_alternate</span></div>}</div>
              <div><p className="font-semibold text-white">{image ? image.name : "Choose PNG, JPEG, WebP or GIF"}</p><p className="mt-1 text-xs leading-5 text-slate-500">Maximum 8 MB. The image and metadata JSON are pinned to public IPFS.</p><span className="mt-3 inline-flex rounded-lg bg-white/[0.05] px-3 py-2 text-xs font-semibold text-slate-300 group-hover:text-white">Select artwork</span></div>
              <input type="file" className="hidden" accept="image/png,image/jpeg,image/webp,image/gif" onChange={e=>setImage(e.target.files?.[0] || null)} />
            </label></div>

            <div className="mt-6 flex flex-wrap items-center gap-3"><button disabled={busy || !canCreate} className="people-button-primary">{busy ? "Working…" : "Upload metadata & create NFT"}<span className="material-symbols-outlined text-lg">arrow_forward</span></button>{!canCreate && <span className="text-xs text-amber-300">This wallet cannot create factory collections.</span>}</div>

            {createdNft && <div className="mt-5 rounded-2xl border border-success/20 bg-success/10 p-4"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="text-sm font-bold text-success">Credential created</p><p className="mt-1 break-all text-xs text-slate-300">{createdNft}</p></div><button type="button" onClick={activateNft} disabled={busy || !canConfigure} className="people-button-secondary">Activate for claims</button></div></div>}
          </form>

          <div className="space-y-6">
            <form onSubmit={configureClaim} className="people-card p-6">
              <div><p className="people-kicker">Step 2</p><h2 className="mt-2 text-xl font-bold text-white">Configure claim window</h2><p className="mt-2 text-sm leading-6 text-slate-400">Only the Keccak-256 hash is stored as contract state. Keep the plaintext event code separately.</p></div>
              <div className="mt-5"><label className="people-label">Event claim code</label><div className="relative"><span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-500">key</span><input className="people-input pl-11" type="password" autoComplete="new-password" placeholder="Enter event claim code" value={claimCode} onChange={e=>setClaimCode(e.target.value)} /></div></div>
              <div className="mt-4"><label className="people-label">Claim deadline</label><input className="people-input" type="datetime-local" value={deadline} onChange={e=>setDeadline(e.target.value)} /></div>
              <button disabled={busy || !canConfigure} className="people-button-primary mt-5 w-full">Configure claim</button>
              <p className="mt-3 text-[11px] leading-5 text-slate-500">Submitted claim codes are visible in transaction calldata. Do not use passwords or other sensitive secrets.</p>
            </form>

            <section className="people-card p-6">
              <div className="flex items-start justify-between gap-3"><div><p className="people-kicker">Event status</p><h2 className="mt-2 text-lg font-bold text-white">Current controller state</h2></div><span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${activeConfigured ? "bg-success/10 text-success" : "bg-white/[0.05] text-slate-500"}`}>{activeConfigured ? "Minting configured" : "No active NFT"}</span></div>
              <dl className="mt-5 space-y-4 text-sm"><div className="flex justify-between gap-4"><dt className="text-slate-500">Active collection</dt><dd className="font-mono text-xs text-slate-300">{activeConfigured ? shortAddress(String(currentNft)) : "—"}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Deadline</dt><dd className="text-right text-slate-300">{deadlineText}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Controller access</dt><dd className="text-success">{canConfigure ? "Authorized" : "No access"}</dd></div></dl>
              {activeConfigured && <button type="button" onClick={stopMinting} disabled={busy || !canConfigure} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-500/[0.07] px-4 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-500/10 disabled:opacity-50"><span className="material-symbols-outlined text-lg">stop_circle</span> Stop minting</button>}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

function Metric({ label, value, icon, tone = "default" }: { label: string; value: string; icon: string; tone?: "default" | "success" | "danger" | "muted" }) {
  const toneClass = tone === "success" ? "text-success" : tone === "danger" ? "text-red-300" : tone === "muted" ? "text-slate-500" : "text-primary";
  return <div className="people-card p-5"><div className="flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-500">{label}</p><span className={`material-symbols-outlined text-xl ${toneClass}`}>{icon}</span></div><p className="mt-4 truncate text-sm font-bold text-white" title={value}>{value}</p></div>;
}
