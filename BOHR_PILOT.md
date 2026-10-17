# PEOPLE — Bohr pilot

This integration keeps the historical QIE deployment unchanged and provides a focused single-event pilot on BOT Chain's Bohr testnet.

## Live Bohr contracts

- `POAPDapp`: `0x506001C295d80944DE4ed4015af03Bb0E348aeB5`
- `POAPFactory`: `0xAdf4d9B286D4c757d5aAce5EE544318F895A0E06`
- Network: Bohr testnet, chain ID `968`
- Explorer: `https://scan.bohr.life`

Both core contracts are source-verified on the Bohr explorer.

## Contracts

- `POAPDapp` V2: reusable event claim controller. Stores the active NFT, `codeHash`, `claimDeadline`, admin state and event-scoped `hasClaimed[nft][attendee]` state.
- `POAPFactory`: owner/admin-restricted factory for event-specific attendance collections.
- `EventPOAP`: event-specific soulbound ERC-721. Only the configured controller can mint; transfers and approvals are disabled; all tokens in a collection use the event metadata URI.

## Claim-code model

The organizer shares a code with attendees. `POAPDapp` stores only `keccak256(code)` and never stores or emits the plaintext code as contract state.

The organizer dashboard therefore cannot recover or display a previously configured plaintext code. It shows whether a code hash is configured and lets an authorized owner/admin replace it.

Calling `configureClaim(newCodeHash, newDeadline)` rotates the code hash and deadline for the currently active event. Calling `activateEvent(nft, codeHash, deadline)` atomically replaces the active event and its claim settings. Already minted NFTs remain unchanged, and claim state remains scoped to each NFT collection.

The attendee submits the plaintext code to `mint(code)`, so the code can become visible in transaction calldata after a claim. For this pilot, possession of the event code plus wallet control and an unclaimed/in-window state constitutes eligibility; it is not a pre-approved wallet allowlist.

## IPFS metadata

The dashboard uploads event artwork and metadata through a server-side Next.js route to Pinata. `PINATA_JWT` remains server-side and must never use the `NEXT_PUBLIC_` prefix. Metadata contains event information only and should not include attendee PII.

## Access control

- Factory owner/admins can create event NFT collections.
- POAPDapp owner/admins can activate an NFT, configure claim settings and stop minting.
- Only each contract owner can add or remove that contract's admins.
- Attendee wallets cannot use privileged factory/controller functions.

## Bohr fee note

Bohr reported a 20 gwei minimum effective tip during deployment. The successful pilot deployment used an explicit 25 gwei EIP-1559 priority/max fee in the deployment script.

## Environment

Frontend:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...
NEXT_PUBLIC_POAP_DAPP_ADDRESS=0x506001C295d80944DE4ed4015af03Bb0E348aeB5
NEXT_PUBLIC_POAP_FACTORY_ADDRESS=0xAdf4d9B286D4c757d5aAce5EE544318F895A0E06
PINATA_JWT=...
```

Contracts: create `smart-contract/.env` with `WALLET_KEY` only in a secure local/deployment environment. Never commit it.

## Validation

The Bohr pilot contract test suite currently covers 12 passing cases, including:

1. successful claim;
2. wrong-code rejection;
3. duplicate-claim rejection;
4. expired-claim rejection;
5. stopped-minting rejection;
6. owner/admin access control;
7. factory access control;
8. non-controller mint rejection; and
9. soulbound transfer/approval rejection.

Frontend production builds should be run before each review deployment:

```bash
cd frontend
npm ci
npm run build
```

## V2 controller migration

The original Bohr controller at `0x1807F7c4984f5188e948C2e828fadE1b2F0011eb` used a global `hasClaimed[address]` mapping and was suitable only for one event. The current V2 controller at `0x506001C295d80944DE4ed4015af03Bb0E348aeB5` uses `hasClaimed[nftContract][attendee]`, enabling the same attendee wallet to claim once per event collection.

V2 also introduces atomic `activateEvent(nft, codeHash, deadline)`. Organizers no longer need to stop minting before selecting a new event, and a newly selected NFT cannot accidentally inherit the previous event's claim code/deadline.

The factory was not redeployed. `NEXT_PUBLIC_POAP_DAPP_ADDRESS` should point to `0x506001C295d80944DE4ed4015af03Bb0E348aeB5` before creating any new EventPOAP collection so its immutable `minter` points to V2. EventPOAPs created with the original controller cannot be remapped because their `minter` is immutable.

Historical POAP discovery is factory-based rather than active-controller-based. My POAPs scans `EventPOAPCreated` and mint `Transfer` logs, preserving visibility of old credentials after event rotation.


## Current frontend addresses

```env
NEXT_PUBLIC_POAP_DAPP_ADDRESS=0x506001C295d80944DE4ed4015af03Bb0E348aeB5
NEXT_PUBLIC_POAP_FACTORY_ADDRESS=0xAdf4d9B286D4c757d5aAce5EE544318F895A0E06
NEXT_PUBLIC_POAP_FACTORY_DEPLOY_TX=0x62e6c6b2468aee10741f705f30e7917d365f9981261a255da9d2e5e0c9a1fcca
```
