/**
 * CrackedPassport ABI (hand-maintained subset). After `forge build`, this can
 * be regenerated from contracts/out/CrackedPassport.sol/CrackedPassport.json,
 * but only these entries are used by the app.
 */
export const crackedPassportAbi = [
  {
    type: "function",
    name: "mintPassport",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "fellowNumber", type: "uint256" },
      { name: "uri", type: "string" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "setTokenURI",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "uri", type: "string" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "tokenURI",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
  },
] as const;

/**
 * CrackedCertificates ABI (subset). Each activity is one ERC-1155 token id that
 * many fellows hold — hackathons, Luma events, house activities, build posts.
 */
export const crackedCertificatesAbi = [
  {
    type: "function",
    name: "createActivity",
    stateMutability: "nonpayable",
    inputs: [
      { name: "id", type: "uint256" },
      { name: "name", type: "string" },
      { name: "metadataUri", type: "string" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "claimFor",
    stateMutability: "nonpayable",
    inputs: [
      { name: "id", type: "uint256" },
      { name: "holder", type: "address" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "setActivityURI",
    stateMutability: "nonpayable",
    inputs: [
      { name: "id", type: "uint256" },
      { name: "metadataUri", type: "string" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "claimCount",
    stateMutability: "view",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "hasClaimed",
    stateMutability: "view",
    inputs: [
      { name: "id", type: "uint256" },
      { name: "holder", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [
      { name: "account", type: "address" },
      { name: "id", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;
