# PEOPLE Frontend

PEOPLE is a Web3 event-attendance application for issuing and claiming verifiable, non-transferable attendance NFTs. The current pilot runs on BOT Chain's Bohr testnet and uses a Next.js frontend, Wagmi/RainbowKit wallet integration, a factory for event-specific soulbound NFTs, and Pinata-backed IPFS metadata.

## Current features

- Responsive landing, claim, organizer dashboard and **My POAPs** experiences.
- Wallet connection through RainbowKit/Wagmi.
- Event-specific NFT creation through `POAPFactory`.
- Artwork and metadata uploads through a server-side Pinata route.
- Event NFT activation through `POAPDapp`.
- Hashed claim-code configuration with an explicit claim deadline.
- Controller-level duplicate-claim prevention.
- Owner/admin access controls for the factory and claim controller.
- Owner-only dashboard controls for granting and revoking factory or claim-admin permissions.
- My POAPs gallery using direct Bohr RPC reads and IPFS metadata resolution.

## Claim-code behavior

The dashboard never stores or displays the plaintext claim code after it is configured. It hashes the code with Keccak-256 and stores only `codeHash` on-chain.

The dashboard therefore shows **Claim code: Configured** rather than attempting to recover the original value. Owners/admins can replace the current code by entering a new code and deadline in **Update claim settings**.

Updating claim settings:

- replaces the current `codeHash`;
- replaces the current `claimDeadline`;
- applies to the currently active EventPOAP collection;
- does not modify already minted NFTs; and
- does not reset existing `hasClaimed` state.

A claimant submits the plaintext code when calling `mint(code)`, so the code can be visible in transaction calldata after a claim. Event codes must not be reused as passwords or other sensitive secrets.

## Access model

`POAPFactory` and `POAPDapp` have separate admin scopes:

- **Factory owner/admin**: can create event-specific NFT collections.
- **POAPDapp owner/admin**: can activate an NFT, configure claim settings and stop minting.
- **Owner only**: can add or remove admins for the contract they own.
- **Attendee**: can only use the public claim flow.

The deployer is displayed as **Owner** in the organizer dashboard instead of being mislabeled as an admin.

## Bohr deployment

- Chain ID: `968`
- RPC: `https://rpc.bohr.life`
- Explorer: `https://scan.bohr.life`
- `POAPDapp`: `0x1807F7c4984f5188e948C2e828fadE1b2F0011eb`
- `POAPFactory`: `0xAdf4d9B286D4c757d5aAce5EE544318F895A0E06`

Both core contracts are source-verified on the Bohr explorer.

## Environment variables

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...
NEXT_PUBLIC_POAP_DAPP_ADDRESS=0x1807F7c4984f5188e948C2e828fadE1b2F0011eb
NEXT_PUBLIC_POAP_FACTORY_ADDRESS=0xAdf4d9B286D4c757d5aAce5EE544318F895A0E06
PINATA_JWT=...
# Optional
NEXT_PUBLIC_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/
```

`PINATA_JWT` is server-only. Never expose it with a `NEXT_PUBLIC_` prefix.

## Development

```bash
cd frontend
npm ci
npm run dev
```

Production build:

```bash
npm run build
```

## Mobile support

The redesign uses responsive Tailwind layouts for phone, tablet and desktop. Dashboard grids collapse to one column on small screens, forms use large touch targets, wallet state is handled through RainbowKit, and owner/admin controls stack vertically on mobile.

Before release, test at common phone widths (320-430 px), especially wallet menus, long addresses, upload controls, date/time inputs and transaction feedback.

## V2 event rotation and POAP history

The dashboard uses `activateEvent` when a freshly created collection is ready. The new NFT, code hash and deadline become active atomically, immediately replacing the previous event in the controller UI.

The claim page calls `hasClaimed(activeNft, wallet)`, so claim eligibility is event-specific.

My POAPs no longer depends on the currently active NFT. It discovers every collection emitted by `POAPFactory.EventPOAPCreated`, then filters ERC-721 mint `Transfer` events to the connected wallet. This preserves the user's full PEOPLE attendance history across event rotations.

The frontend also uses the public factory deployment transaction to derive the factory start block. Override it with `NEXT_PUBLIC_POAP_FACTORY_DEPLOY_TX` if the factory is redeployed.
