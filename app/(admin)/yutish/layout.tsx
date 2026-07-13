import { notFound } from "next/navigation";
import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import { BrandMark } from "@/components/brand-mark";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Admin is invisible to everyone else — 404, not a redirect.
  if (!(await isAdmin())) notFound();

  return (
    <div className="flex min-h-[100dvh]">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-black/[0.06] p-6 md:flex">
        <BrandMark href="/yutish" className="text-xl" />
        <p className="eyebrow mt-1">Admin</p>
        <nav className="mt-8 flex flex-col gap-1 text-sm">
          <Link href="/yutish/applications" className="rounded-lg px-3 py-2 text-ink-2 hover:bg-black/[0.04]">
            Applications
          </Link>
          <Link href="/yutish/fellows" className="rounded-lg px-3 py-2 text-ink-2 hover:bg-black/[0.04]">
            Fellows
          </Link>
        </nav>
      </aside>
      <main className="flex-1 px-6 py-10 md:px-12">{children}</main>
    </div>
  );
}
