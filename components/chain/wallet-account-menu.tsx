"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function short(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/** Account pill for a wallet-only session — the Clerk <UserButton /> equivalent. */
export function WalletAccountMenu({ address }: { address: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    await fetch("/api/auth/wallet/signout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 font-mono text-xs text-ink-2 shadow-sm"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-moss" />
        {short(address)}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-44 overflow-hidden rounded-xl border border-black/10 bg-white py-1 shadow-lg">
          <div className="px-3 py-2 text-xs text-ink-4">Signed in with Core</div>
          <button
            onClick={signOut}
            disabled={busy}
            className="w-full px-3 py-2 text-left text-sm text-ink-2 hover:bg-black/[0.04] disabled:opacity-50"
          >
            {busy ? "…" : "Sign out"}
          </button>
        </div>
      )}
    </div>
  );
}
