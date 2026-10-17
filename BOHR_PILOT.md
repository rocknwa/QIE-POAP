# PEOPLE — Bohr single-event pilot

This integration keeps the historical QIE deployment unchanged and provides a focused single-event pilot on BOT Chain's Bohr testnet.

## Live Bohr contracts

- `POAPDapp`: `0x1807F7c4984f5188e948C2e828fadE1b2F0011eb`
- `POAPFactory`: `0xAdf4d9B286D4c757d5aAce5EE544318F895A0E06`
- Network: Bohr testnet, chain ID `968`
- Explorer: `https://scan.bohr.life`

Both core contracts are source-verified on the Bohr explorer.

## Contracts

- `POAPDapp`: single-event claim controller. Stores `codeHash`, `claimDeadline`, active NFT address, admin state and `hasClaimed` state.
- `POAPFactory`: owner/admin-restricted factory for event-specific attendance collections.
- `EventPOAP`: event-specific soulbound ERC-721. Only the configured controller can mint; transfers and approvals are disabled; all tokens in a collection use the event metadata URI.

## Claim-code model

The organizer shares a code with attendees. `POAPDapp` stores only `keccak256(code)` and never stores or emits the plaintext code as contract state.

The organizer dashboard therefore cannot recover or display a previously configured plaintext code. It shows whether a code hash is configured and lets an authorized owner/admin replace it.

Calling `configureClaim(newCodeHash, newDeadline)` replaces both the current code hash and the current deadline for the active single-event controller. It does not modify already minted NFTs and does not reset `hasClaimed` state.

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
NEXT_PUBLIC_POAP_DAPP_ADDRESS=0x1807F7c4984f5188e948C2e828fadE1b2F0011eb
NEXT_PUBLIC_POAP_FACTORY_ADDRESS=0xAdf4d9B286D4c757d5aAce5EE544318F895A0E06
PINATA_JWT=...
```

Contracts: create `smart-contract/.env` with `WALLET_KEY` only in a secure local/deployment environment. Never commit it.

## Validation

The Bohr pilot contract test suite currently covers 15 passing cases, including:

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

The original Bohr controller used a global `hasClaimed[address]` mapping and was suitable only for one event. V2 changes this to `hasClaimed[nftContract][attendee]`, enabling the same attendee wallet to claim once per event collection.

V2 also introduces atomic `activateEvent(nft, codeHash, deadline)`. Organizers no longer need to stop minting before selecting a new event, and a newly selected NFT cannot accidentally inherit the previous event's claim code/deadline.

The factory is not redeployed. After deploying V2, update `NEXT_PUBLIC_POAP_DAPP_ADDRESS` before creating any new EventPOAP collection so its immutable `minter` points to V2. EventPOAPs created with the original controller cannot be remapped because their `minter` is immutable.

Historical POAP discovery is factory-based rather than active-controller-based. My POAPs scans `EventPOAPCreated` and mint `Transfer` logs, preserving visibility of old credentials after event rotation.
