import type { ReactNode } from "react";
import { kicker } from "./infoStyles";

export function PageHero({ eyebrow, title, children, actions }: { eyebrow: string; title: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b border-white/[0.05]">
      <div className="pointer-events-none absolute left-1/2 top-[-16rem] h-[30rem] w-[48rem] max-w-full -translate-x-1/2 rounded-full bg-violet-600/20 blur-[120px]" />
      <div className="people-shell relative py-16 sm:py-20">
        <p className={kicker}>{eyebrow}</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-[-0.03em] text-white sm:text-5xl">{title}</h1>
        <div className="mt-5 max-w-2xl text-base leading-8 text-slate-400 sm:text-lg">{children}</div>
        {actions && <div className="mt-8 flex flex-col gap-3 sm:flex-row">{actions}</div>}
      </div>
    </section>
  );
}

export function Section({ id, eyebrow, title, children }: { id?: string; eyebrow?: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-32">
      {eyebrow && <p className={kicker}>{eyebrow}</p>}
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h2>
      <div className="mt-4 space-y-4 text-sm leading-7 text-slate-400 sm:text-base sm:leading-8">{children}</div>
    </section>
  );
}

export function Steps({ items }: { items: ReactNode[] }) {
  return (
    <ol className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="people-card flex gap-4 p-4 sm:p-5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-violet-500/30 bg-violet-500/10 text-sm font-extrabold text-[color:var(--violet-light)]">{i + 1}</span>
          <div className="min-w-0 text-sm leading-7 text-slate-300 sm:text-base sm:leading-8">{item}</div>
        </li>
      ))}
    </ol>
  );
}

export function Callout({ tone = "info", title, children }: { tone?: "info" | "warning"; title: string; children: ReactNode }) {
  const styles = tone === "warning" ? "border-amber-400/25 bg-amber-400/[0.06]" : "border-violet-500/25 bg-violet-500/[0.07]";
  const icon = tone === "warning" ? "warning" : "info";
  const iconColor = tone === "warning" ? "text-amber-300" : "text-[color:var(--violet-light)]";
  return (
    <div className={`flex gap-3 rounded-2xl border p-4 sm:p-5 ${styles}`}>
      <span className={`material-symbols-outlined mt-0.5 text-xl ${iconColor}`}>{icon}</span>
      <div className="min-w-0 text-sm leading-7 text-slate-300">
        <p className="font-bold text-white">{title}</p>
        <div className="mt-1 space-y-2">{children}</div>
      </div>
    </div>
  );
}

export function KeyValue({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="people-card divide-y divide-white/[0.06] overflow-hidden">
      {rows.map(([k, v]) => (
        <div key={k} className="grid gap-1 px-4 py-3 sm:grid-cols-[170px_1fr] sm:gap-4 sm:px-5">
          <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">{k}</dt>
          <dd className="min-w-0 break-words text-sm text-slate-200">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function MessageTable({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <div className="people-card divide-y divide-white/[0.06] overflow-hidden">
      {rows.map(([message, meaning]) => (
        <div key={message} className="grid gap-1 px-4 py-4 sm:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] sm:gap-6 sm:px-5">
          <p className="text-sm font-semibold text-white">{message}</p>
          <p className="text-sm leading-6 text-slate-400">{meaning}</p>
        </div>
      ))}
    </div>
  );
}

export function FeatureTile({ icon, title, children }: { icon: string; title: string; children: ReactNode }) {
  return (
    <div className="people-card p-5">
      <span className="grid h-10 w-10 place-items-center rounded-xl border border-violet-500/25 bg-violet-500/10">
        <span className="material-symbols-outlined text-[22px] text-[color:var(--violet-light)]">{icon}</span>
      </span>
      <h3 className="mt-4 text-base font-bold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{children}</p>
    </div>
  );
}
