import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { copy } from "@/lib/copy";

const links = [
  { href: "/", label: copy.nav.home },
  { href: "/about", label: copy.nav.about },
  { href: "/apply", label: copy.nav.apply },
];

/** Centered pill nav — ported from the marketing site's chrome. */
export function SiteNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto flex h-[92px] max-w-[1320px] items-center justify-between px-[clamp(20px,4vw,56px)]">
        <BrandMark />

        <nav
          aria-label="Primary"
          className="flex items-center gap-1 rounded-full border border-black/[0.06] bg-white/70 p-1 backdrop-blur-xl"
        >
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full px-4 py-1.5 text-sm text-ink-2 transition-colors hover:bg-black/[0.04] hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/passport"
            className="rounded-full bg-ink px-4 py-1.5 text-sm text-paper transition-transform hover:-translate-y-px"
          >
            {copy.nav.passport}
          </Link>
        </nav>
      </div>
    </header>
  );
}
