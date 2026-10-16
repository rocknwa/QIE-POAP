"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useReadContract } from "wagmi";
import { useEffect, useState } from "react";
import { POAP_DAPP_ADDRESS, poapDappAbi } from "../app/constants";

const nav = [
  ["Home", "/"],
  ["Claim", "/claim"],
  ["My POAPs", "/events"],
] as const;

export default function AppHeader() {
  const pathname = usePathname();
  const { address } = useAccount();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const enabled = Boolean(mounted && POAP_DAPP_ADDRESS && address);
  const { data: owner } = useReadContract({ address: POAP_DAPP_ADDRESS!, abi: poapDappAbi, functionName: "owner", query: { enabled } });
  const { data: admin } = useReadContract({ address: POAP_DAPP_ADDRESS!, abi: poapDappAbi, functionName: "admins", args: address ? [address] : undefined, query: { enabled } });
  const canAdmin = Boolean(address && (admin || owner?.toLowerCase() === address.toLowerCase()));

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0b0f19]/85 backdrop-blur-xl">
      <div className="people-shell flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-violet/30 bg-violet/10 text-primary shadow-violet">
              <span className="material-symbols-outlined text-[21px]">token</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold tracking-tight text-white">PEOPLE</span>
              <span className="hidden rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:inline">Protocol</span>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {nav.map(([label, href]) => {
              const active = pathname === href;
              return <Link key={href} href={href} className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${active ? "bg-white/[0.07] text-white" : "text-slate-400 hover:bg-white/[0.04] hover:text-white"}`}>{label}</Link>;
            })}
            {mounted && canAdmin && (
              <Link href="/dashboard" className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${pathname === "/dashboard" ? "bg-white/[0.07] text-white" : "text-slate-400 hover:bg-white/[0.04] hover:text-white"}`}>
                Dashboard <span className="rounded-full bg-violet/20 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-primary">Admin</span>
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 sm:flex">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60"/><span className="relative inline-flex h-2 w-2 rounded-full bg-success"/></span>
            <span className="text-xs font-semibold text-slate-300">Bohr Testnet</span>
            <span className="text-[10px] font-bold text-success">968</span>
          </div>
          {mounted ? <ConnectButton chainStatus="icon" showBalance={false} accountStatus={{ smallScreen: "avatar", largeScreen: "full" }} /> : <div className="h-10 w-28 rounded-xl bg-white/[0.05]" />}
        </div>
      </div>
      <div className="border-t border-white/[0.04] md:hidden">
        <div className="people-shell flex items-center gap-1 overflow-x-auto py-2">
          {nav.map(([label, href]) => <Link key={href} href={href} className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold ${pathname === href ? "bg-white/[0.08] text-white" : "text-slate-400"}`}>{label}</Link>)}
          {mounted && canAdmin && <Link href="/dashboard" className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold ${pathname === "/dashboard" ? "bg-white/[0.08] text-white" : "text-slate-400"}`}>Dashboard</Link>}
        </div>
      </div>
    </header>
  );
}
