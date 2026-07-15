import { NextResponse } from "next/server";
import { issueNonce, siweMessage } from "@/lib/wallet-session";

export async function GET() {
  const { nonce, token } = await issueNonce();
  return NextResponse.json({ message: siweMessage(nonce), token });
}
