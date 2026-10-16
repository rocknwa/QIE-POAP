"use client";

import Link from "next/link";

const steps = [
  ["01", "Create an event credential", "Organizers deploy an event-specific soulbound NFT with artwork and metadata stored on IPFS."],
  ["02", "Verify attendance", "Attendees use the event claim code during the configured claim window."],
  ["03", "Keep proof permanently", "The non-transferable credential stays in the attendee wallet as verifiable proof of participation."],
];

const features = [
  ["verified_user", "Verifiable attendance", "Proof lives on-chain and can be checked independently on the Bohr explorer."],
  ["lock", "Soulbound credentials", "Attendance NFTs are non-transferable, preserving the integrity of participation records."],
  ["image", "Event-specific identity", "Each event gets its own artwork, name, symbol and IPFS-backed metadata."],
  ["shield_lock", "Controlled claims", "Hashed claim credentials, explicit deadlines and duplicate-claim protection are enforced by the contract."],
];

export default function HomeContent() {
  return (
    <main>
      <section className="relative overflow-hidden border-b border-white/[0.05]">
        <div className="pointer-events-none absolute left-1/2 top-[-18rem] h-[38rem] w-[58rem] -translate-x-1/2 rounded-full bg-violet/20 blur-[120px]" />
        <div className="people-shell relative grid min-h-[680px] items-center gap-14 py-20 lg:grid-cols-[1.05fr_.95fr] lg:py-24">
          <div>
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <span className="people-status"><span className="h-1.5 w-1.5 rounded-full bg-success" /> Live on Bohr Testnet</span>
              <span className="people-status">Soulbound ERC-721</span>
            </div>
            <p className="people-kicker mb-4">Proof of participation</p>
            <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-[-0.035em] text-white sm:text-5xl lg:text-6xl">Proof of attendance, <span className="text-primary">made verifiable.</span></h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-400 sm:text-lg">PEOPLE lets event organizers issue non-transferable attendance credentials while attendees claim proof of participation directly to their wallets.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/claim" className="people-button-primary">Claim attendance <span className="material-symbols-outlined text-lg">arrow_forward</span></Link>
              <Link href="/events" className="people-button-secondary">View My POAPs</Link>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-8 gap-y-3 text-xs text-slate-500">
              <span className="flex items-center gap-2"><span className="material-symbols-outlined text-base text-success">check_circle</span> Event-specific NFTs</span>
              <span className="flex items-center gap-2"><span className="material-symbols-outlined text-base text-success">check_circle</span> IPFS metadata</span>
              <span className="flex items-center gap-2"><span className="material-symbols-outlined text-base text-success">check_circle</span> On-chain claim rules</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -inset-10 rounded-full bg-violet/10 blur-3xl" />
            <div className="people-card-elevated relative overflow-hidden p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">Credential preview</p><p className="mt-1 font-bold text-white">PEOPLE Attendance</p></div>
                <span className="rounded-full border border-success/20 bg-success/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-success">Verified</span>
              </div>
              <div className="relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_50%_35%,rgba(124,58,237,.52),rgba(17,24,39,.98)_62%)]">
                <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] [background-size:32px_32px]" />
                <div className="absolute inset-0 grid place-items-center">
                  <div className="grid h-40 w-40 place-items-center rounded-[2rem] border border-primary/35 bg-black/30 shadow-[0_0_70px_rgba(124,58,237,.45)] backdrop-blur">
                    <span className="material-symbols-outlined text-[86px] text-primary">token</span>
                  </div>
                </div>
                <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
                  <div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">Soulbound credential</p><p className="mt-1 text-lg font-bold text-white">Proof that you were there.</p></div>
                  <span className="rounded-lg bg-black/40 px-2.5 py-1.5 text-xs font-bold text-primary backdrop-blur">#968</span>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2">
                {[['Network','Bohr'],['Token','BOT'],['Standard','ERC-721']].map(([k,v]) => <div key={k} className="rounded-xl bg-white/[0.035] p-3"><p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{k}</p><p className="mt-1 text-xs font-bold text-slate-200">{v}</p></div>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="people-shell py-20">
        <div className="max-w-2xl"><p className="people-kicker">How it works</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">Simple enough for attendees. Verifiable enough for organizers.</h2></div>
        <div className="mt-10 grid gap-4 lg:grid-cols-3">{steps.map(([n,t,d]) => <article key={n} className="people-card p-6"><p className="text-sm font-extrabold text-primary">{n}</p><h3 className="mt-6 text-xl font-bold text-white">{t}</h3><p className="mt-3 text-sm leading-6 text-slate-400">{d}</p></article>)}</div>
      </section>

      <section className="border-y border-white/[0.05] bg-white/[0.015]">
        <div className="people-shell py-20"><div className="text-center"><p className="people-kicker">Why PEOPLE</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-white">Event credentials without Web3 clutter.</h2></div><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{features.map(([icon,t,d]) => <article key={t} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-violet/10 text-primary"><span className="material-symbols-outlined text-xl">{icon}</span></span><h3 className="mt-5 font-bold text-white">{t}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{d}</p></article>)}</div></div>
      </section>

      <section className="people-shell py-20">
        <div className="people-card-elevated flex flex-col items-start justify-between gap-6 overflow-hidden p-7 sm:p-10 lg:flex-row lg:items-center">
          <div><p className="people-kicker">For organizers</p><h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">Create an attendance credential for your event.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Upload artwork, create the soulbound NFT, set the claim window and let attendees mint proof of participation.</p></div>
          <Link href="/dashboard" className="people-button-primary whitespace-nowrap">Open Organizer Dashboard</Link>
        </div>
      </section>
    </main>
  );
}
