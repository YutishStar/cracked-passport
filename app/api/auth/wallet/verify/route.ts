import { NextRequest, NextResponse } from "next/server";
import { verifyMessage } from "viem";
import { verifyNonce, siweMessage, createWalletSession } from "@/lib/wallet-session";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * Second half of "Sign in with Core": the wallet has signed the nonce message.
 * We check the signature actually came from that address, then look up which
 * (already-verified) Fellow that wallet belongs to and start their session.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { address, signature, nonce, token } = body ?? {};
  if (!address || !signature || !nonce || !token) {
    return NextResponse.json({ ok: false, error: "Malformed request." }, { status: 400 });
  }

  if (!(await verifyNonce(token, nonce))) {
    return NextResponse.json(
      { ok: false, error: "That sign-in request expired. Try again." },
      { status: 400 },
    );
  }

  const valid = await verifyMessage({
    address: address as `0x${string}`,
    message: siweMessage(nonce),
    signature,
  }).catch(() => false);
  if (!valid) {
    return NextResponse.json({ ok: false, error: "Signature didn't check out." }, { status: 401 });
  }

  const { data: wallet } = await supabaseAdmin()
    .from("wallets")
    .select("fellow_id, verified_at")
    .eq("address", (address as string).toLowerCase())
    .maybeSingle();
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const w = wallet as any;
  if (!w?.fellow_id || !w.verified_at) {
    return NextResponse.json(
      { ok: false, error: "This wallet isn't linked to a Cracked Passport yet." },
      { status: 404 },
    );
  }

  const { data: fellow } = await supabaseAdmin()
    .from("fellows")
    .select("fellow_number, status")
    .eq("id", w.fellow_id)
    .maybeSingle();
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const f = fellow as any;
  if (!f || f.status === "revoked") {
    return NextResponse.json({ ok: false, error: "This Passport isn't active." }, { status: 403 });
  }

  await createWalletSession(w.fellow_id, address as string);
  return NextResponse.json({ ok: true, fellowNumber: f.fellow_number });
}
