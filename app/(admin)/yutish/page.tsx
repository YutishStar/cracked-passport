import Link from "next/link";
import { listApplications } from "@/lib/supabase/queries/applications";
import { listFellows } from "@/lib/supabase/queries/fellows";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const [pending, fellows] = await Promise.all([
    listApplications("pending"),
    listFellows(),
  ]);
  const claimed = fellows.filter((f) => f.status === "claimed").length;

  return (
    <div>
      <h1 className="font-display text-4xl text-ink">Overview</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Pending applications" value={pending.length} href="/yutish/applications" />
        <Stat label="Fellows" value={fellows.length} href="/yutish/fellows" />
        <Stat label="Claimed passports" value={claimed} href="/yutish/fellows" />
      </div>
    </div>
  );
}

function Stat({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-black/[0.06] bg-white p-6 transition-colors hover:border-black/20"
    >
      <div className="font-pixel text-5xl text-ink">{value}</div>
      <div className="eyebrow mt-2">{label}</div>
    </Link>
  );
}
