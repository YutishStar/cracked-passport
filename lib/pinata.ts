import "server-only";
import { env } from "@/lib/env";

/** Pin a JSON object to IPFS via Pinata. Returns the CID. */
export async function pinJson(
  name: string,
  json: Record<string, unknown>,
): Promise<string> {
  const jwt = env.pinataJwt;
  if (!jwt) throw new Error("PINATA_JWT not set");

  const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({
      pinataMetadata: { name },
      pinataContent: json,
    }),
  });
  if (!res.ok) {
    throw new Error(`Pinata pin failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { IpfsHash: string };
  return data.IpfsHash;
}

export function ipfsUri(cid: string): string {
  return `ipfs://${cid}`;
}
