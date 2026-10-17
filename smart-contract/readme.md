# PEOPLE Smart Contracts

The current PEOPLE Bohr pilot uses three Solidity contracts:

- `POAPDapp` — single-event claim controller.
- `POAPFactory` — owner/admin-restricted factory for event NFT collections.
- `EventPOAP` — event-specific soulbound ERC-721 attendance NFT.

The historical QIE deployment remains unchanged.

## Security model

### Claim controller

`POAPDapp` stores:

- the active `poapNftContract`;
- `bytes32 codeHash`;
- `uint256 claimDeadline`;
- controller admins; and
- `hasClaimed(address)` state.

An attendee calls `mint(string code)`. The contract hashes the supplied code and compares it to `codeHash`, checks the deadline and duplicate state, marks the wallet as claimed before the external NFT mint, and then mints through the configured EventPOAP.

The plaintext event code is not recoverable from contract state. Reconfiguring a claim calls `configureClaim(newCodeHash, newClaimDeadline)`, replacing both values for the currently active controller. It does not modify existing NFTs or reset previous `hasClaimed` entries.

Because `mint(code)` includes the plaintext code in calldata, the code may become publicly visible after a claim. Event codes must not be used as sensitive secrets.

### Event NFT

`EventPOAP`:

- is an ERC-721 attendance credential;
- can only be minted by the configured PEOPLE controller;
- disables transfers;
- disables approvals; and
- returns the event metadata URI for its tokens.

### Factory

`POAPFactory` is not permissionless:

- owner and approved factory admins can create EventPOAP collections;
- only the owner can add/remove factory admins; and
- public attendee wallets cannot create collections through the factory.

`POAPDapp` has its own separate owner/admin scope for claim configuration and NFT activation.

## Bohr deployment

- Chain ID: `968`
- RPC: `https://rpc.bohr.life`
- Explorer: `https://scan.bohr.life`
- `POAPDapp`: `0x1807F7c4984f5188e948C2e828fadE1b2F0011eb`
- `POAPFactory`: `0xAdf4d9B286D4c757d5aAce5EE544318F895A0E06`

Both contracts are verified on the Bohr explorer.

## Development

```bash
cd smart-contract
npm ci
npx hardhat compile
npm test
```

The current pilot suite has 15 passing tests covering factory access, NFT mint restrictions, soulbound behavior, claim configuration, admin authorization, successful claims, wrong-code rejection, duplicate claims, expiration and stopped minting.

## Deployment

Use a dedicated development/deployment wallet funded with test BOT. Store its key only in local/deployment secrets:

```env
WALLET_KEY=0x...
```

The successful Bohr pilot deployment required an explicit priority fee because the RPC enforces a minimum effective tip. Do not commit private keys or `.env` files.

## Scope note

The current `POAPDapp` is intentionally a **single-event pilot controller**. Replacing the active NFT or claim code does not create isolated per-event claim history; `hasClaimed` belongs to the controller. A future multi-event version should introduce event-scoped claim state (for example `claimed[eventId][wallet]`) before using one controller concurrently across multiple events.

## POAPDapp V2

V2 scopes duplicate protection by collection:

```solidity
mapping(address => mapping(address => bool)) public hasClaimed;
// hasClaimed[nftContract][attendee]
```

`activateEvent(address nft, bytes32 codeHash, uint256 deadline)` atomically selects a collection and its claim settings. `configureClaim` rotates the code/deadline for the active event without resetting claim history. `updateNFTContract` is retained as a lower-level admin function but deliberately clears code/deadline; normal organizer UI should use `activateEvent`.

The existing factory remains deployed. Deploy only the new controller with `scripts/deploy-poap-v2.js`, verify it, then point the frontend at the new controller before creating future collections.
