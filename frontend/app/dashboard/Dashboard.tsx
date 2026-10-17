"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAccount, usePublicClient, useReadContract, useWriteContract } from "wagmi";
import { isAddress, keccak256, parseEventLogs, toBytes, zeroAddress, zeroHash } from "viem";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { poapDappAbi, poapFactoryAbi, POAP_DAPP_ADDRESS, POAP_FACTORY_ADDRESS } from "../constants";
import { transactionErrorMessage } from "../../lib/transactionError";

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
  const [adminAddress, setAdminAddress] = useState("");

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
  const { data: currentCodeHash, refetch: refetchCodeHash } = useReadContract({ address: POAP_DAPP_ADDRESS!, abi: poapDappAbi, functionName: "codeHash", query: { enabled: Boolean(POAP_DAPP_ADDRESS) } });

  const isDappOwner = Boolean(address && owner?.toLowerCase() === address.toLowerCase());
  const isFactoryOwner = Boolean(address && factoryOwner?.toLowerCase() === address.toLowerCase());
  const isOwner = isDappOwner || isFactoryOwner;
  const isDappAdmin = Boolean(admin);
  const isFactoryAdmin = Boolean(factoryAdmin);
  const canConfigure = isDappOwner || isDappAdmin;
  const canCreate = isFactoryOwner || isFactoryAdmin;
  const canAdmin = canConfigure || canCreate;
  const roleLabel = isOwner
    ? "Owner"
    : `${isFactoryAdmin ? "Factory Admin" : ""}${isFactoryAdmin && isDappAdmin ? " · " : ""}${isDappAdmin ? "Claim Admin" : ""}` || "Organizer";
  const activeConfigured = Boolean(currentNft && currentNft !== zeroAddress);
  const claimCodeConfigured = Boolean(currentCodeHash && currentCodeHash !== zeroHash);
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
      toast.error(transactionErrorMessage(error, "Unable to create the event NFT. Please try again."));
    } finally { setBusy(false); }
  }

  async function configureClaim(e: FormEvent) {
    e.preventDefault();
    if (!canConfigure || !POAP_DAPP_ADDRESS || !publicClient || !claimCode.trim() || !deadline) return toast.error("Enter a claim code and future deadline using an authorized admin wallet.");
    const unixDeadline = BigInt(Math.floor(new Date(deadline).getTime() / 1000));
    if (unixDeadline <= BigInt(Math.floor(Date.now() / 1000))) return toast.error("Deadline must be in the future.");
    const hashOfCode = keccak256(toBytes(claimCode.trim()));

    setBusy(true);
    try {
      const isActivatingNewEvent = Boolean(createdNft);
      const hash = isActivatingNewEvent
        ? await writeContractAsync({
            address: POAP_DAPP_ADDRESS,
            abi: poapDappAbi,
            functionName: "activateEvent",
            args: [createdNft as `0x${string}`, hashOfCode, unixDeadline],
          })
        : await writeContractAsync({
            address: POAP_DAPP_ADDRESS,
            abi: poapDappAbi,
            functionName: "configureClaim",
            args: [hashOfCode, unixDeadline],
          });
      await publicClient.waitForTransactionReceipt({ hash });
      await Promise.all([refetchNft(), refetchDeadline(), refetchCodeHash()]);
      setClaimCode("");
      if (isActivatingNewEvent) {
        setCreatedNft("");
        toast.success("New event activated. It immediately replaced the previous active event.");
      } else {
        toast.success(claimCodeConfigured ? "Claim code and deadline updated for the active event." : "Claim code and deadline configured for the active event.");
      }
    } catch (error) { toast.error(transactionErrorMessage(error, "Unable to update the event claim settings. Please try again.")); }
    finally { setBusy(false); }
  }

  async function stopMinting() {
    if (!canConfigure || !POAP_DAPP_ADDRESS || !publicClient) return;
    if (!window.confirm("Stop claims for the active event? The NFT can be reconfigured later by an admin.")) return;
    setBusy(true);
    try {
      const hash = await writeContractAsync({ address: POAP_DAPP_ADDRESS, abi: poapDappAbi, functionName: "stopMinting" });
      await publicClient.waitForTransactionReceipt({ hash });
      await Promise.all([refetchNft(), refetchDeadline(), refetchCodeHash()]);
      toast.success("Minting stopped.");
    } catch (error) { toast.error(transactionErrorMessage(error, "Unable to stop minting. Please try again.")); }
    finally { setBusy(false); }
  }

  async function updateAdminAccess(scope: "dapp" | "factory", action: "add" | "remove") {
    if (!publicClient) return;
    const target = adminAddress.trim();
    if (!isAddress(target)) return toast.error("Enter a valid EVM wallet address.");

    const isScopeOwner = scope === "dapp" ? isDappOwner : isFactoryOwner;
    if (!isScopeOwner) return toast.error(`Only the ${scope === "dapp" ? "controller" : "factory"} owner can manage this access.`);

    setBusy(true);
    try {
      let hash: `0x${string}`;

      if (scope === "dapp") {
        if (!POAP_DAPP_ADDRESS) {
          return toast.error("Claim controller address is not configured.");
        }

        hash =
          action === "add"
            ? await writeContractAsync({
                address: POAP_DAPP_ADDRESS,
                abi: poapDappAbi,
                functionName: "addAdmin",
                args: [target],
              })
            : await writeContractAsync({
                address: POAP_DAPP_ADDRESS,
                abi: poapDappAbi,
                functionName: "removeAdmin",
                args: [target],
              });
      } else {
        if (!POAP_FACTORY_ADDRESS) {
          return toast.error("Factory address is not configured.");
        }

        hash =
          action === "add"
            ? await writeContractAsync({
                address: POAP_FACTORY_ADDRESS,
                abi: poapFactoryAbi,
                functionName: "addAdmin",
                args: [target],
              })
            : await writeContractAsync({
                address: POAP_FACTORY_ADDRESS,
                abi: poapFactoryAbi,
                functionName: "removeAdmin",
                args: [target],
              });
      }

      await publicClient.waitForTransactionReceipt({ hash });
      toast.success(`${scope === "dapp" ? "Claim" : "Factory"} admin ${action === "add" ? "added" : "removed"}.`);
    } catch (error) {
      toast.error(transactionErrorMessage(error, "Unable to update admin access. Please try again."));
    } finally {
      setBusy(false);
    }
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
          <Metric label="Your role" value={roleLabel} icon="admin_panel_settings" />
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

            {createdNft && <div className="mt-5 rounded-2xl border border-success/20 bg-success/10 p-4"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="text-sm font-bold text-success">Credential created · ready to activate</p><p className="mt-1 break-all text-xs text-slate-300">{createdNft}</p><p className="mt-2 text-xs leading-5 text-slate-400">Set its claim code and deadline in Step 2. Activation is atomic, so this collection and its claim settings replace the old active event in one transaction.</p></div><span className="people-status self-start sm:self-auto">Pending activation</span></div></div>}
          </form>

          <div className="space-y-6">
            <form onSubmit={configureClaim} className="people-card p-6">
              <div>
                <p className="people-kicker">Step 2</p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl font-bold text-white">{createdNft ? "Activate new event" : claimCodeConfigured ? "Update claim settings" : "Configure claim settings"}</h2>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${claimCodeConfigured ? "bg-success/10 text-success" : "bg-white/[0.05] text-slate-500"}`}>
                    Claim code: {createdNft ? "New event" : claimCodeConfigured ? "Configured" : "Not configured"}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-400">Only the Keccak-256 hash is stored as contract state. The plaintext code cannot be recovered after submission. A newly created collection is activated together with its code and deadline in one transaction.</p>
              </div>

              {claimCodeConfigured && !createdNft && (
                <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/[0.07] p-4">
                  <div className="flex gap-3">
                    <span className="material-symbols-outlined text-xl text-primary">info</span>
                    <div>
                      <p className="text-sm font-semibold text-white">The existing code is intentionally hidden.</p>
                      <p className="mt-1 text-xs leading-5 text-slate-400">Enter a new code below to replace it. Updating these settings changes the code and deadline used by the currently active attendance NFT. Already minted NFTs are unaffected, and previous claim records are not reset.</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-5"><label className="people-label">{createdNft ? "Claim code for new event" : claimCodeConfigured ? "New event claim code" : "Event claim code"}</label><div className="relative"><span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-500">key</span><input className="people-input pl-11" type="password" autoComplete="new-password" placeholder={createdNft ? "Enter the new event claim code" : claimCodeConfigured ? "Enter a replacement claim code" : "Enter event claim code"} value={claimCode} onChange={e=>setClaimCode(e.target.value)} /></div></div>
              <div className="mt-4"><label className="people-label">{createdNft ? "Claim deadline for new event" : claimCodeConfigured ? "New claim deadline" : "Claim deadline"}</label><input className="people-input" type="datetime-local" value={deadline} onChange={e=>setDeadline(e.target.value)} /></div>
              <button disabled={busy || !canConfigure} className="people-button-primary mt-5 w-full">{createdNft ? "Activate new event" : claimCodeConfigured ? "Update claim settings" : "Configure claim settings"}</button>
              <p className="mt-3 text-[11px] leading-5 text-slate-500">A claimant submits the plaintext code in the mint transaction, so the code can become visible in transaction calldata after a claim. Do not use passwords or other sensitive secrets as event codes.</p>
              {createdNft && <p className="mt-2 text-[11px] leading-5 text-primary">Activating this event replaces the currently active NFT immediately. Previous POAPs remain in attendee wallets and in My POAPs history.</p>}
            </form>

            <section className="people-card p-6">
              <div className="flex items-start justify-between gap-3"><div><p className="people-kicker">Event status</p><h2 className="mt-2 text-lg font-bold text-white">Current controller state</h2></div><span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${activeConfigured ? "bg-success/10 text-success" : "bg-white/[0.05] text-slate-500"}`}>{activeConfigured ? "Minting configured" : "No active NFT"}</span></div>
              <dl className="mt-5 space-y-4 text-sm"><div className="flex justify-between gap-4"><dt className="text-slate-500">Active collection</dt><dd className="font-mono text-xs text-slate-300">{activeConfigured ? shortAddress(String(currentNft)) : "—"}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Claim code</dt><dd className={claimCodeConfigured ? "text-success" : "text-slate-500"}>{claimCodeConfigured ? "Configured · plaintext not recoverable" : "Not configured"}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Deadline</dt><dd className="text-right text-slate-300">{deadlineText}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Controller access</dt><dd className="text-success">{canConfigure ? "Authorized" : "No access"}</dd></div></dl>
              {activeConfigured && <button type="button" onClick={stopMinting} disabled={busy || !canConfigure} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-500/[0.07] px-4 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-500/10 disabled:opacity-50"><span className="material-symbols-outlined text-lg">stop_circle</span> Stop minting</button>}
            </section>
          </div>
        </div>

        {isOwner && (
          <section className="mt-6 people-card p-6 sm:p-7">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <p className="people-kicker">Owner controls</p>
                <h2 className="mt-2 text-xl font-bold text-white">Manage organizer access</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                  Factory admins can create event NFT collections. Claim admins can activate collections, configure claim windows and stop minting. Only the respective contract owner can grant or revoke each permission.
                </p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                <span className="material-symbols-outlined text-base">verified_user</span> Owner only
              </span>
            </div>

            <div className="mt-6">
              <label className="people-label">Admin wallet address</label>
              <input
                className="people-input font-mono"
                placeholder="0x…"
                value={adminAddress}
                onChange={(e) => setAdminAddress(e.target.value)}
                spellCheck={false}
                autoComplete="off"
              />
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-white">Claim controller access</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">Configure claim codes and deadlines, activate NFTs and stop minting.</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${isDappOwner ? "bg-success/10 text-success" : "bg-white/[0.05] text-slate-500"}`}>{isDappOwner ? "You own" : "Not owner"}</span>
                </div>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <button type="button" disabled={busy || !isDappOwner} onClick={() => updateAdminAccess("dapp", "add")} className="people-button-secondary flex-1">Add claim admin</button>
                  <button type="button" disabled={busy || !isDappOwner} onClick={() => updateAdminAccess("dapp", "remove")} className="inline-flex flex-1 items-center justify-center rounded-xl border border-red-400/20 bg-red-500/[0.07] px-4 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40">Remove</button>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-white">Factory access</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">Create new event-specific soulbound NFT collections from the organizer dashboard.</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${isFactoryOwner ? "bg-success/10 text-success" : "bg-white/[0.05] text-slate-500"}`}>{isFactoryOwner ? "You own" : "Not owner"}</span>
                </div>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <button type="button" disabled={busy || !isFactoryOwner} onClick={() => updateAdminAccess("factory", "add")} className="people-button-secondary flex-1">Add factory admin</button>
                  <button type="button" disabled={busy || !isFactoryOwner} onClick={() => updateAdminAccess("factory", "remove")} className="inline-flex flex-1 items-center justify-center rounded-xl border border-red-400/20 bg-red-500/[0.07] px-4 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40">Remove</button>
                </div>
              </div>
            </div>

            <p className="mt-4 text-[11px] leading-5 text-slate-500">Grant only the minimum permission needed. Removing factory access does not remove claim-controller access, and vice versa.</p>
          </section>
        )}
      </div>
    </main>
  );
}

function Metric({ label, value, icon, tone = "default" }: { label: string; value: string; icon: string; tone?: "default" | "success" | "danger" | "muted" }) {
  const toneClass = tone === "success" ? "text-success" : tone === "danger" ? "text-red-300" : tone === "muted" ? "text-slate-500" : "text-primary";
  return <div className="people-card p-5"><div className="flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-500">{label}</p><span className={`material-symbols-outlined text-xl ${toneClass}`}>{icon}</span></div><p className="mt-4 truncate text-sm font-bold text-white" title={value}>{value}</p></div>;
}
