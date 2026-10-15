export const poapDappAbi = [
  { type: "function", name: "owner", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "admins", stateMutability: "view", inputs: [{ name: "", type: "address" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "poapNftContract", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "codeHash", stateMutability: "view", inputs: [], outputs: [{ type: "bytes32" }] },
  { type: "function", name: "claimDeadline", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "hasClaimed", stateMutability: "view", inputs: [{ name: "", type: "address" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "configureClaim", stateMutability: "nonpayable", inputs: [{ name: "newCodeHash", type: "bytes32" }, { name: "newClaimDeadline", type: "uint256" }], outputs: [] },
  { type: "function", name: "updateNFTContract", stateMutability: "nonpayable", inputs: [{ name: "newContract", type: "address" }], outputs: [] },
  { type: "function", name: "stopMinting", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { type: "function", name: "mint", stateMutability: "nonpayable", inputs: [{ name: "code", type: "string" }], outputs: [] },
  { type: "function", name: "addAdmin", stateMutability: "nonpayable", inputs: [{ name: "admin", type: "address" }], outputs: [] },
  { type: "function", name: "removeAdmin", stateMutability: "nonpayable", inputs: [{ name: "admin", type: "address" }], outputs: [] },
  { type: "error", name: "NotAuthorized", inputs: [] },
  { type: "error", name: "MintingDisabled", inputs: [] },
  { type: "error", name: "InvalidCode", inputs: [] },
  { type: "error", name: "MintingExpired", inputs: [] },
  { type: "error", name: "AlreadyMinted", inputs: [] },
] as const;

export const poapFactoryAbi = [
  { type: "function", name: "createEventPOAP", stateMutability: "nonpayable", inputs: [
    { name: "name_", type: "string" }, { name: "symbol_", type: "string" },
    { name: "metadataURI_", type: "string" }, { name: "minter_", type: "address" }
  ], outputs: [{ name: "poap", type: "address" }] },
  { type: "event", name: "EventPOAPCreated", inputs: [
    { indexed: true, name: "creator", type: "address" }, { indexed: true, name: "poap", type: "address" },
    { indexed: true, name: "minter", type: "address" }, { indexed: false, name: "name", type: "string" },
    { indexed: false, name: "symbol", type: "string" }, { indexed: false, name: "metadataURI", type: "string" }
  ] }
] as const;

export const POAP_DAPP_ADDRESS = process.env.NEXT_PUBLIC_POAP_DAPP_ADDRESS as `0x${string}` | undefined;
export const POAP_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_POAP_FACTORY_ADDRESS as `0x${string}` | undefined;
