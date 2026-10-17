# PEOPLE — Verifiable Event Attendance

PEOPLE is a Web3 event-attendance platform that lets organizers create event-specific soulbound NFTs and lets attendees claim verifiable proof of participation directly to their wallets.

The current implementation includes a focused BOT Chain Bohr testnet pilot while preserving the historical QIE deployment.

## Current architecture

- **POAPFactory** — owner/admin-restricted deployment of event-specific attendance NFT collections.
- **EventPOAP** — non-transferable ERC-721 credential with event metadata stored on IPFS.
- **POAPDapp** — single-event claim controller with hashed claim codes, explicit deadlines and duplicate-claim state.
- **Next.js frontend** — organizer dashboard, attendee claim flow and My POAPs gallery.
- **Pinata/IPFS** — artwork and event metadata uploaded through a server-side route; no attendee PII is required in public metadata.
- **Wagmi + RainbowKit** — wallet and Bohr network integration.

## Bohr pilot

- Network: Bohr testnet (`968`)
- `POAPDapp`: `0x1807F7c4984f5188e948C2e828fadE1b2F0011eb`
- `POAPFactory`: `0xAdf4d9B286D4c757d5aAce5EE544318F895A0E06`
- Explorer: `https://scan.bohr.life`

The two core contracts are source-verified.

## Organizer flow

1. Connect an owner or authorized organizer wallet.
2. Upload event artwork, name, symbol and description.
3. Pin artwork/metadata to IPFS and create an EventPOAP through the factory.
4. Activate the created NFT in `POAPDapp`.
5. Configure a claim code and deadline.
6. Share the event code with attendees.
7. Review claim status and manage admins from the dashboard.

Factory permissions and claim-controller permissions are deliberately separate. Only the relevant contract owner can grant or revoke admins.

## Claim-code behavior

Only `keccak256(code)` is stored as `codeHash`. The plaintext code cannot be retrieved from the blockchain or dashboard after configuration.

The dashboard displays whether a code is configured and allows an authorized owner/admin to replace it. Updating claim settings replaces both the code hash and deadline for the currently active event NFT. Existing minted NFTs are unaffected, and existing `hasClaimed` entries are not cleared.

When an attendee claims, the plaintext code is submitted in transaction calldata and can therefore become public after the transaction. Event claim codes should be treated as temporary event credentials, not passwords.

## Attendee flow

1. Connect a wallet on Bohr.
2. Enter the event claim code before the deadline.
3. Claim the soulbound attendance NFT.
4. View the credential in **My POAPs** and open it on the Bohr explorer.

Transfers and approvals are disabled for EventPOAP credentials.

## Local development

Contracts:

```bash
cd smart-contract
npm ci
npm test
```

Frontend:

```bash
cd frontend
npm ci
npm run build
npm run dev
```

See `BOHR_PILOT.md`, `smart-contract/readme.md`, `frontend/readme.md` and `frontend/STITCH_INTEGRATION.md` for implementation details.

## Pilot scope

The current controller is intentionally single-event. A future multi-event controller should use event-scoped configuration and claim state before one controller is reused for independent simultaneous events.

## Reusable event controller (V2)

The Bohr pilot now uses a reusable claim-controller design. Claim state is scoped by event NFT collection (`hasClaimed[nft][attendee]`), so one wallet may claim once for Event A and later claim once for Event B.

A new event is activated atomically with `activateEvent(nft, codeHash, deadline)`. This immediately replaces the prior active event and its claim settings in one transaction. Updating the code/deadline with `configureClaim` affects only the currently active event and does not reset existing claims for that NFT.

The existing `POAPFactory` remains the permanent registry source for event collections. The My POAPs page reads `EventPOAPCreated` and ERC-721 `Transfer` mint events, so previously claimed credentials remain visible even after another event becomes active.

The first deployed Bohr controller is not upgradeable. V2 therefore requires a new controller deployment. Existing EventPOAPs and already minted NFTs remain valid; new collections must be created with the V2 controller as their minter. Upgradeability (for example UUPS with timelocked governance and storage-layout tests) can be assessed separately before a production mainnet version.
