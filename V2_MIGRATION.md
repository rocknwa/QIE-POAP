# PEOPLE Bohr V2 migration

The original controller is already deployed and non-upgradeable, so the reusable event fix is deployed as a new controller. The existing factory and previously minted NFTs are preserved.

## 1. Test

```bash
cd smart-contract
npm test
```

The suite covers per-event duplicate protection, same-wallet claims across two event collections, code rotation, atomic activation, expiry and admin controls.

## 2. Deploy only POAPDapp V2

```bash
npx hardhat run scripts/deploy-poap-v2.js --network bohr
```

The script uses the Bohr fee settings already required by the network. Record the V2 address.

## 3. Verify

```bash
npx hardhat verify --network bohr 0x506001C295d80944DE4ed4015af03Bb0E348aeB5
```

## 4. Update frontend

Set:

```env
NEXT_PUBLIC_POAP_DAPP_ADDRESS=0x506001C295d80944DE4ed4015af03Bb0E348aeB5
NEXT_PUBLIC_POAP_FACTORY_ADDRESS=0xAdf4d9B286D4c757d5aAce5EE544318F895A0E06
NEXT_PUBLIC_POAP_FACTORY_DEPLOY_TX=0x62e6c6b2468aee10741f705f30e7917d365f9981261a255da9d2e5e0c9a1fcca
```

Keep the existing Pinata and WalletConnect variables.

## 5. Important EventPOAP minter rule

`EventPOAP.minter` is immutable. Collections created before the V2 environment update point to the original controller and cannot be switched to V2. They remain valid historical NFTs, but new claimable events should be created after the frontend points to V2.

## 6. Acceptance checks

1. Create Event A with V2 as minter, activate it with code/deadline, claim from Wallet X.
2. Reclaim Event A from Wallet X: must revert `AlreadyMinted`.
3. Create Event B, activate it without calling stopMinting, confirm dashboard immediately shows Event B.
4. Claim Event B from the same Wallet X: must succeed.
5. Open My POAPs: Event A and Event B must both appear.
6. Rotate Event B's claim code: old code must fail, new code must work for an unclaimed wallet, and Wallet X must remain unable to claim Event B again.

## Upgradeability later

V2 is still a normal non-proxy deployment. If PEOPLE moves to an upgradeable production controller later, use a deliberate UUPS/transparent-proxy design with initializer protection, storage-layout regression checks, multisig/timelock upgrade authority and an explicit upgrade runbook. Do not retrofit proxy semantics onto the already deployed controllers. 


## Deployed V2 controller

`0x506001C295d80944DE4ed4015af03Bb0E348aeB5`

The existing factory remains `0xAdf4d9B286D4c757d5aAce5EE544318F895A0E06`.
