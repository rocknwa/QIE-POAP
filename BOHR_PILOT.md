# PEOPLE — Bohr single-event pilot

This integration keeps the historical QIE deployment unchanged.

## Contracts
- `POAPDapp`: single-event claim controller. Stores only `codeHash`, an explicit `claimDeadline`, active NFT address, admin state, and `hasClaimed` state.
- `POAPFactory`: deploys event-specific attendance collections.
- `EventPOAP`: event-specific ERC-721. Only the configured controller can mint; transfers and approvals are disabled; every token points to the same event metadata URI.

## Claim-code model
The organizer shares a code with attendees. The controller stores only `keccak256(code)` and does not emit the plaintext code. The attendee submits the plaintext code when claiming; therefore the code is visible in transaction calldata after a claim. Reusing or broadly sharing a code means anyone who learns it can attempt a claim until the deadline. Duplicate claims by the same wallet are rejected by controller state.

For this pilot, "unauthorized" means a claim using the wrong event code. This is not a pre-approved wallet allowlist.

## IPFS metadata
The dashboard uploads event artwork and metadata through a server-side Next.js route to Pinata. `PINATA_JWT` must remain server-side and must never use the `NEXT_PUBLIC_` prefix. Metadata contains event information only; no attendee PII is included.

## Bohr
- Chain ID: 968
- RPC: `https://rpc.bohr.life`
- Explorer: `https://scan.bohr.life`
- Native gas token: BOT

## Environment
Copy `frontend/.env.example` and set the values. After deploying the contracts, set the two public contract addresses in the frontend environment.

For contracts, create `smart-contract/.env` with `WALLET_KEY` only in a secure local/deployment environment. Never commit it.

## Commands
```bash
cd smart-contract
npm ci
npm test
npm run deploy:bohr

cd ../frontend
npm ci
npm run build
```

## Review acceptance tests
1. Correct code before deadline mints one attendance NFT.
2. Same wallet cannot claim twice.
3. Wrong code reverts.
4. Claim after deadline reverts.
5. Stopped minting reverts.
6. Direct NFT mint from a non-controller reverts.
7. NFT transfer and approval attempts revert.

## Factory access control
`POAPFactory` is not permissionless. The deployer is initialized as both owner and admin. Only approved admins can create event NFT collections; only the factory owner can add or remove factory admins. Public attendee wallets cannot deploy collections through the PEOPLE factory.
