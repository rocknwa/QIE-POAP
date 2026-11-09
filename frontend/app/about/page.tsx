import type { Metadata } from "next";
import Link from "next/link";
import ContactActions from "../../components/ContactActions";
import { Callout, FeatureTile, KeyValue, PageHero, Section } from "../../components/InfoBlocks";
import { primaryButton, secondaryButton } from "../../components/infoStyles";
import { BOT_CHAIN_NAME, BOT_EXPLORER_URL, BOT_WEBSITE_URL, botChain } from "../botchain";

export const metadata: Metadata = {
  title: "About — PEOPLE",
  description: "What PEOPLE is, how it works for organizers and attendees, and how it relates to BOT Chain.",
};

export default function AboutPage() {
  return (
    <main>
      <PageHero
        eyebrow="About"
        title="About PEOPLE"
        actions={
          <>
            <Link href="/docs" className={primaryButton}>Read the documentation</Link>
            <Link href="/claim" className={secondaryButton}>Claim attendance</Link>
          </>
        }
      >
        <p>PEOPLE is a web application for issuing and claiming verifiable proof of attendance on {BOT_CHAIN_NAME}.</p>
      </PageHero>

      <div className="people-shell max-w-4xl space-y-16 py-16">
        <Section eyebrow="Overview" title="What PEOPLE is">
          <p>
            PEOPLE lets event organizers create an attendance credential for an event, and lets attendees claim that credential
            to their own wallet. Each credential is an ERC-721 NFT that cannot be transferred after it is minted, so it stays in the
            wallet that claimed it as a record of participation.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <FeatureTile icon="image" title="One collection per event">
              Every event gets its own NFT collection with its own name, symbol, description and artwork.
            </FeatureTile>
            <FeatureTile icon="lock" title="Non-transferable">
              Attendance NFTs are soulbound. Transfers and approvals are disabled in the contract.
            </FeatureTile>
            <FeatureTile icon="key" title="Claim-code based">
              Attendees enter a code set by the organizer before the claim deadline. Each wallet can claim once per event.
            </FeatureTile>
          </div>
        </Section>

        <Section eyebrow="Project" title="An independent project">
          <Callout title="PEOPLE is independent of BOT Chain">
            <p>
              PEOPLE is an independent project. It is not an official BOT Chain product, and BOT Chain does not own or operate it.
            </p>
          </Callout>
          <p>
            PEOPLE is built to run on {BOT_CHAIN_NAME}, and that is the only network it currently supports. Mentions of BOT Chain
            in the app describe the network it runs on.
          </p>
        </Section>

        <Section eyebrow="For organizers" title="Organizing events and distributing NFTs">
          <p>Approved organizers use the Organizer Dashboard to run an event:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Create the event’s attendance NFT with a name, symbol, description and artwork. The artwork and metadata are stored on public IPFS.</li>
            <li>Activate the event by setting a claim code and a claim deadline.</li>
            <li>Share the claim code with attendees through your own channel. Attendees then mint the credential directly to their wallets, so organizers do not collect wallet addresses or send tokens by hand.</li>
          </ul>
          <p>
            One event is active for claims at a time. Activating a new event replaces the previous one, while credentials that were
            already claimed stay in attendees’ wallets.
          </p>
          <p>
            The dashboard is limited to approved wallets. See the{" "}
            <Link href="/docs#create-event" className="font-semibold text-[color:var(--violet-light)] underline underline-offset-4">documentation</Link>{" "}
            for the full organizer workflow.
          </p>
        </Section>

        <Section eyebrow="For participants" title="Taking part in an event and claiming your NFT">
          <ul className="list-disc space-y-2 pl-5">
            <li>Get the event claim code from the organizer.</li>
            <li>Open the <Link href="/claim" className="font-semibold text-[color:var(--violet-light)] underline underline-offset-4">Claim</Link> page and connect the wallet that should receive the credential.</li>
            <li>Enter the code and claim. The credential is minted to your wallet, and you pay only the BOT network gas fee.</li>
            <li>Find everything you have claimed on the <Link href="/events" className="font-semibold text-[color:var(--violet-light)] underline underline-offset-4">My POAPs</Link> page.</li>
          </ul>
        </Section>

        <Section eyebrow="Network" title="PEOPLE and BOT Chain">
          <p>
            All PEOPLE contracts and transactions live on {BOT_CHAIN_NAME}. Transactions and NFTs link to BOTScan, the BOT Chain block explorer.
          </p>
          <KeyValue
            rows={[
              ["Network", BOT_CHAIN_NAME],
              ["Chain ID", String(botChain.id)],
              ["Currency", "BOT"],
              ["BOT Chain website", <a key="w" href={BOT_WEBSITE_URL} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">{BOT_WEBSITE_URL.replace("https://", "")}</a>],
              ["Block explorer", <a key="e" href={BOT_EXPLORER_URL} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">{BOT_EXPLORER_URL.replace("https://", "")}</a>],
            ]}
          />
        </Section>

        <section className="people-card-elevated p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-[color:var(--violet-light)]">Organizer access</p>
          <h2 className="mt-2 text-2xl font-bold text-white">Want to organize an event?</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
            Creating and activating events requires an approved wallet. If your wallet does not have organizer access, contact the
            PEOPLE project administrator and include the wallet address you plan to use.
          </p>
          <ContactActions className="mt-6" />
        </section>
      </div>
    </main>
  );
}
