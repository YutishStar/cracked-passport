import Link from "next/link";
import { listFellows } from "@/lib/supabase/queries/fellows";
import { fmt } from "@/lib/copy";

export const dynamic = "force-dynamic";

export default async function FellowsPage() {
  const fellows = await listFellows();
  return (
    <div>
      <h1 className="font-display text-4xl text-ink">Fellows</h1>
      <div className="mt-8 overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-black/[0.06] text-left text-ink-4">
            <tr>
              <th className="px-5 py-3 font-normal">#</th>
              <th className="px-5 py-3 font-normal">Name</th>
              <th className="px-5 py-3 font-normal">Handle</th>
              <th className="px-5 py-3 font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {fellows.map((f) => (
              <tr key={f.id} className="border-b border-black/[0.04] last:border-0">
                <td className="px-5 py-3 font-pixel text-lg text-ink">{fmt(f.fellow_number)}</td>
                <td className="px-5 py-3">
                  <Link href={`/admin/fellows/${f.id}`} className="text-ink hover:underline">
                    {f.display_name}
                  </Link>
                </td>
                <td className="px-5 py-3 text-ink-3">{f.username ? `@${f.username}` : "—"}</td>
                <td className="px-5 py-3">
                  <span
                    className={
                      f.status === "claimed"
                        ? "rounded-full bg-moss-soft px-2.5 py-1 text-xs text-moss"
                        : "rounded-full bg-black/[0.05] px-2.5 py-1 text-xs text-ink-3"
                    }
                  >
                    {f.status}
                  </span>
                </td>
              </tr>
            ))}
            {fellows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-ink-3">
                  No fellows yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
