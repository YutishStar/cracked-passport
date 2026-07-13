import Link from "next/link";
import { cn } from "@/lib/utils";

/** The Cracked wordmark — pixel-serif with a moss dot. */
export function BrandMark({
  href = "/",
  className,
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "font-pixel text-ink text-2xl leading-none tracking-tight",
        className,
      )}
      aria-label="Cracked — home"
    >
      crackedHQ<span className="text-moss">.</span>
    </Link>
  );
}
