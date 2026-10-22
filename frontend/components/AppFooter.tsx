
const ecosystem = [
  ["BOT Chain", "https://botchain.ai"],
  ["BOT Chain Explorer", "https://scan.botchain.ai"],
] as const;

export default function AppFooter() {
  return (
    <footer className="mt-auto border-t border-white/[0.06] bg-[#0b0f19]/85">
      <div className="people-shell flex flex-col items-start justify-between gap-6 py-8 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg border border-violet/30 bg-violet/10 text-primary">
            <span className="material-symbols-outlined text-[18px]">token</span>
          </span>
          <div>
            <p className="text-sm font-extrabold tracking-tight text-white">PEOPLE</p>
            <p className="text-xs text-slate-500">Verifiable event attendance on Bohr.</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">Ecosystem</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold">
            <a href="https://botchain.ai" target="_blank" rel="noopener noreferrer" aria-label="BOT Chain" className="flex items-center gap-3">
              <span className="text-slate-300">Built on</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/botchain-logo.png" alt="BOT Chain" width={409} height={80} className="h-6 w-auto" />
            </a>
            {ecosystem.map(([label, href]) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 transition hover:text-white"
              >
                {label} <span className="text-slate-600">· {href.replace("https://", "")}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
