import type { Metadata } from "next";
import Link from "next/link";
import ContactActions from "../../components/ContactActions";
import { Callout, KeyValue, MessageTable, PageHero, Section, Steps } from "../../components/InfoBlocks";
import { kicker } from "../../components/infoStyles";
import {
  BOT_CHAIN_NAME,
  BOT_EXPLORER_URL,
  POAP_DAPP_ADDRESS,
  POAP_FACTORY_ADDRESS,
  addressUrl,
  botChain,
} from "../botchain";

export const metadata: Metadata = {
  title: "Documentation — PEOPLE",
  description: "How to connect a wallet, create events, claim attendance NFTs and troubleshoot common issues in PEOPLE.",
};

const toc = [
  ["introduction", "Introduction"],
  ["network-wallet", "Network and wallet requirements"],
  ["connect-wallet", "Connect a wallet"],
  ["create-event", "Create an event"],
  ["event-settings", "Configure event NFT settings"],
  ["claim", "Find an event and claim"],
  ["verify", "Verify a claim"],
  ["troubleshooting", "Troubleshooting"],
  ["organizer-access", "Get organizer access"],
] as const;

const link = "font-semibold text-[color:var(--violet-light)] underline underline-offset-4";
const ui = "rounded-md bg-white/[0.07] px-1.5 py-0.5 text-[0.85em] font-semibold text-slate-100";

export default function DocsPage() {
  return (
    <main>
      <PageHero eyebrow="Documentation" title="Using PEOPLE">
        <p>A practical guide to the PEOPLE application: connecting a wallet, creating events, claiming attendance NFTs and fixing common problems.</p>
      </PageHero>

      <div className="people-shell py-12 lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
        <aside className="mb-10 lg:mb-0">
          <nav aria-label="On this page" className="people-card p-4 lg:sticky lg:top-28">
            <p className={kicker}>On this page</p>
            <ul className="mt-3 grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-1">
              {toc.map(([id, label]) => (
                <li key={id}>
                  <a href={`#${id}`} className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-400 transition hover:bg-white/[0.05] hover:text-white">{label}</a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <div className="max-w-3xl min-w-0 space-y-16">
          <Section id="introduction" eyebrow="1" title="Introduction to PEOPLE">
            <p>
              PEOPLE issues proof-of-attendance credentials as NFTs on {BOT_CHAIN_NAME}. An organizer creates a credential for an event,
              and attendees claim it to their wallet with a code. Credentials are soulbound ERC-721 tokens, which means they cannot be
              transferred once minted.
            </p>
            <p>The application has these pages:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li><Link href="/" className={link}>Home</Link>: an overview of PEOPLE.</li>
              <li><Link href="/claim" className={link}>Claim</Link>: for attendees to claim the credential for the active event.</li>
              <li><Link href="/events" className={link}>My POAPs</Link>: the attendance credentials claimed by your connected wallet.</li>
              <li><span className="font-semibold text-slate-200">Dashboard</span>: for event organizers. The link appears in the navigation only when the connected wallet has organizer access.</li>
              <li><Link href="/about" className={link}>About</Link>: what PEOPLE is and how it relates to BOT Chain.</li>
            </ul>
            <p>PEOPLE is an independent project and is not an official BOT Chain product.</p>
          </Section>

          <Section id="network-wallet" eyebrow="2" title="Supported network and wallet requirements">
            <p>PEOPLE currently supports one network. Use these settings if your wallet asks for them:</p>
            <KeyValue
              rows={[
                ["Network", BOT_CHAIN_NAME],
                ["Chain ID", String(botChain.id)],
                ["RPC URL", botChain.rpcUrls.default.http[0]],
                ["Currency", "BOT (18 decimals)"],
                ["Block explorer", <a key="e" href={BOT_EXPLORER_URL} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">BOTScan · {BOT_EXPLORER_URL.replace("https://", "")}</a>],
              ]}
            />
            <p>You will need:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>A wallet that can connect to the app. The wallet options are listed in the connect dialog.</li>
              <li>A small amount of BOT to pay network gas for any transaction, including claiming.</li>
            </ul>
            <p>If your wallet is connected to a different network, the app shows an “Unsupported network” bar with a <span className={ui}>Switch to BOT Chain Mainnet</span> button. The app also asks your wallet to switch before it sends a transaction. If the network is not in your wallet yet, your wallet may ask you to add it.</p>
            <p>The app uses these contracts:</p>
            <KeyValue
              rows={[
                ["Claim contract (POAPDapp)", <a key="d" href={addressUrl(POAP_DAPP_ADDRESS)} target="_blank" rel="noopener noreferrer" className="break-all underline underline-offset-4">{POAP_DAPP_ADDRESS}</a>],
                ["Event factory (POAPFactory)", <a key="f" href={addressUrl(POAP_FACTORY_ADDRESS)} target="_blank" rel="noopener noreferrer" className="break-all underline underline-offset-4">{POAP_FACTORY_ADDRESS}</a>],
              ]}
            />
          </Section>

          <Section id="connect-wallet" eyebrow="3" title="How to connect a wallet">
            <Steps
              items={[
                <>Click the wallet connect button at the top right of the page.</>,
                <>Choose your wallet in the dialog and approve the connection in your wallet.</>,
                <>Check that your wallet is on {BOT_CHAIN_NAME}. On larger screens the header shows <span className={ui}>{BOT_CHAIN_NAME} {botChain.id}</span>, and on every screen size the “Unsupported network” bar appears if your wallet is on another network.</>,
              ]}
            />
            <p>
              Connect the wallet that should receive your credential. Claimed credentials are tied to that wallet and cannot be moved to another one.
            </p>
          </Section>

          <Section id="create-event" eyebrow="4" title="How an authorized administrator creates an event">
            <p>
              Events are created on the Dashboard. Creating an event needs <span className="font-semibold text-slate-200">factory admin</span> access,
              and activating it needs <span className="font-semibold text-slate-200">claim admin</span> access. Each permission is granted by the owner of the respective contract (see{" "}
              <a href="#event-settings" className={link}>Configure event NFT settings</a>). Wallets without access see the message “You don’t have organizer access.”
            </p>
            <h3 className="pt-2 text-lg font-bold text-white">Step 1: Create event attendance NFT</h3>
            <Steps
              items={[
                <>Connect an authorized wallet and open <span className={ui}>Dashboard</span> from the navigation.</>,
                <>Enter the <span className={ui}>Event / NFT name</span> (up to 120 characters) and the <span className={ui}>Symbol</span> (up to 16 characters).</>,
                <>Enter a <span className={ui}>Description</span> of what the credential verifies (up to 1,500 characters).</>,
                <>Choose the <span className={ui}>Event artwork</span>: a PNG, JPEG, WebP or GIF image of up to 8 MB.</>,
                <>Click <span className={ui}>Upload metadata &amp; create NFT</span> and confirm the transaction in your wallet. The artwork and metadata are uploaded to public IPFS, and the factory then creates the event’s NFT collection.</>,
                <>When it succeeds, the dashboard shows “Credential created · ready to activate” with the new collection address and a “Pending activation” label.</>,
              ]}
            />
            <Callout tone="warning" title="Activate before leaving the page">
              <p>
                The new collection stays pending only while the dashboard page is open. Set its claim code and deadline (Step 2 below) before you refresh or close the page.
              </p>
            </Callout>
            <p>The name, symbol, description and artwork are fixed when the collection is created. The dashboard has no way to edit them afterwards.</p>
          </Section>

          <Section id="event-settings" eyebrow="5" title="How event NFT settings are configured">
            <h3 className="text-lg font-bold text-white">Step 2: Activate the event</h3>
            <Steps
              items={[
                <>Enter the <span className={ui}>Claim code for new event</span>. This is the code attendees will type to claim. It is entered as a password field.</>,
                <>Choose the <span className={ui}>Claim deadline for new event</span>. It must be in the future.</>,
                <>Click <span className={ui}>Activate new event</span> and confirm in your wallet. The collection, code and deadline are set in one transaction.</>,
              ]}
            />
            <ul className="list-disc space-y-2 pl-5">
              <li>Only one event is active for claims at a time. Activating a new event replaces the previous one immediately. Credentials that were already claimed remain in attendees’ wallets and in My POAPs.</li>
              <li>The contract stores only a hash of the claim code. The plaintext code cannot be recovered afterwards, so keep your own record of it.</li>
              <li>When an attendee claims, they submit the plaintext code in a public transaction. Do not use a password or other sensitive secret as an event code.</li>
            </ul>

            <h3 className="pt-2 text-lg font-bold text-white">Updating the active event</h3>
            <p>
              While an event is active, the same form is labelled <span className={ui}>Update claim settings</span> (or <span className={ui}>Configure claim settings</span> if no code is set yet).
              Enter a new code and deadline to replace the current ones. This changes the code and deadline for the active collection. NFTs that were already minted are unaffected, and previous claim records are not reset.
            </p>

            <h3 className="pt-2 text-lg font-bold text-white">Stopping claims</h3>
            <p>
              When an event is active, the <span className={ui}>Stop minting</span> button appears under “Current controller state”. After you confirm, the dashboard shows no active event and attendees cannot claim.
              To run another event, create a new credential in Step 1 and activate it in Step 2.
            </p>

            <h3 className="pt-2 text-lg font-bold text-white">Managing organizer access (owners only)</h3>
            <p>
              Wallets that own the claim contract or the factory see a <span className={ui}>Manage organizer access</span> section. Enter a wallet address, then use the buttons to add or remove access:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li><span className={ui}>Add claim admin</span> / <span className={ui}>Remove</span>: lets a wallet configure claim codes and deadlines, activate collections and stop minting. Only the claim contract owner can change this.</li>
              <li><span className={ui}>Add factory admin</span> / <span className={ui}>Remove</span>: lets a wallet create new event NFT collections. Only the factory owner can change this.</li>
            </ul>
            <p>The two permissions are separate. Removing one does not remove the other. The dashboard shows your current role (Owner, Factory Admin or Claim Admin) under “Your role”.</p>
          </Section>

          <Section id="claim" eyebrow="6" title="How participants find an event and claim an NFT">
            <p>
              Ask the event organizer for the claim code. The app does not list or publish codes, and the organizer decides how to share them.
              The <Link href="/claim" className={link}>Claim</Link> page shows the status of the one event that is currently active.
            </p>
            <Steps
              items={[
                <>Open the <span className={ui}>Claim</span> page and connect the wallet that should receive the credential.</>,
                <>Check the status badge on the “Current event” card. <span className={ui}>Claiming open</span> means you can claim. <span className={ui}>Expired</span> means the deadline has passed, and <span className={ui}>Not active</span> means no event is active. The claim deadline is shown on the card.</>,
                <>Type the code into <span className={ui}>Event claim code</span>.</>,
                <>Click <span className={ui}>Claim POAP</span> (or press Enter in the code field) and confirm the transaction in your wallet.</>,
                <>Wait for the button to finish “Confirming on BOT Chain…”. Your credential is minted to your wallet.</>,
              ]}
            />
            <ul className="list-disc space-y-2 pl-5">
              <li>Each wallet can claim once per event collection.</li>
              <li>The credential cannot be transferred after minting.</li>
              <li>Codes are matched exactly, including capitalization. Spaces before and after the code are ignored.</li>
            </ul>
          </Section>

          <Section id="verify" eyebrow="7" title="How to verify a successful claim">
            <ul className="list-disc space-y-2 pl-5">
              <li>The Claim page shows “Attendance verified — Your PEOPLE POAP has been minted to your wallet.” with a <span className={ui}>View transaction on BOTScan</span> link.</li>
              <li>The claim button changes to “Already claimed” for that wallet.</li>
              <li>Open <Link href="/events" className={link}>My POAPs</Link>. Each credential your wallet has claimed appears as a card marked “Soulbound”. Select a card to see its token number, collection address and network, and use <span className={ui}>View NFT on BOTScan</span> to open it on the explorer.</li>
            </ul>
            <p>
              If a credential does not appear straight away, use the <span className={ui}>Refresh</span> button on My POAPs. If the artwork is missing, the card shows “Artwork unavailable” (the metadata could not be loaded from the IPFS gateway) or “No artwork found”. Neither means the claim failed.
            </p>
          </Section>

          <Section id="troubleshooting" eyebrow="8" title="Common errors and troubleshooting">
            <h3 className="text-lg font-bold text-white">Claiming</h3>
            <MessageTable
              rows={[
                ["Connect the wallet that should receive the attendance credential.", "No wallet is connected. Use the connect button in the header."],
                ["There is no active event to claim right now.", "No event is active. The status badge shows “Not active”. Ask the organizer whether the event has been activated."],
                ["The claim period for this event has ended.", "The claim deadline has passed. Contact the event organizer."],
                ["This wallet has already claimed this event.", "Each wallet can claim once per event. Check My POAPs."],
                ["Enter the event claim code.", "The code field is empty."],
                ["This event does not have a claim code configured yet.", "The organizer has not set a claim code for the active event."],
                ["That event code is not valid. Check the code and try again.", "The code does not match. Check spelling and capitalization, or ask the organizer to confirm it."],
                ["Claim settings are still loading. Try again in a moment.", "The app is still reading the event settings. Wait a moment and try again."],
                ["The event claim code changed before this transaction completed. Refresh and try again.", "The organizer changed the claim code while your transaction was pending. Refresh the page and ask for the current code."],
                ["Claims are currently disabled for this event.", "Claims for the event have been stopped."],
              ]}
            />
            <h3 className="pt-2 text-lg font-bold text-white">Wallet and network</h3>
            <MessageTable
              rows={[
                ["Please switch your wallet to BOT Chain Mainnet.", "Your wallet is on another network. Use the Switch button, or switch inside your wallet."],
                ["BOT Chain Mainnet isn’t added to your wallet yet. Approve the add-network prompt and try again.", "Approve your wallet’s add-network request, then repeat the action."],
                ["Insufficient BOT balance to pay network gas.", "Your wallet needs BOT to pay the network gas fee."],
                ["Transaction cancelled.", "The request was rejected in your wallet. Try again and approve it."],
                ["The BOT Chain network could not be reached. Please try again.", "The app could not reach the network. Check your connection and try again."],
              ]}
            />
            <h3 className="pt-2 text-lg font-bold text-white">Organizers</h3>
            <MessageTable
              rows={[
                ["You don’t have organizer access.", <>This wallet is not an owner or approved admin. See <a key="a" href="#organizer-access" className={link}>Get organizer access</a>.</>],
                ["Your wallet does not have factory admin access. / This wallet cannot create factory collections.", "Creating events needs factory admin access."],
                ["This wallet is not authorized to perform that action.", "The wallet lacks the permission required for this action. Claim settings need claim admin access, and managing admins needs the contract owner."],
                ["Complete the event details and artwork.", "Name, symbol, description and artwork are all required to create an event."],
                ["Keep the NFT symbol at 16 characters or fewer.", "Shorten the symbol."],
                ["Deadline must be in the future. / The claim deadline must be in the future.", "Choose a claim deadline later than the current time."],
                ["Unable to create the event NFT. Please try again.", "The metadata upload or the transaction did not complete. Try again, and contact the project administrator if it keeps happening."],
              ]}
            />
            <h3 className="pt-2 text-lg font-bold text-white">My POAPs</h3>
            <MessageTable
              rows={[
                ["No attendance NFTs yet", "The connected wallet has not claimed any PEOPLE credential. Check that you connected the wallet you claimed with."],
                ["Could not load your POAP history", "The app could not read your history. Use Refresh and try again."],
              ]}
            />
          </Section>

          <Section id="organizer-access" eyebrow="9" title="Contact the project administrator for organizer access">
            <p>
              The Dashboard is available only to approved wallets, and access is granted by the contract owner. If you want to organize an event and your wallet does not have access,
              contact the PEOPLE project administrator. Including the wallet address you plan to use helps, because access is granted per wallet.
            </p>
            <ContactActions />
          </Section>
        </div>
      </div>
    </main>
  );
}
