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
