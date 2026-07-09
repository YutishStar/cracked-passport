import { fmt } from "@/lib/copy";

/**
 * A passport-style machine-readable-zone string. Purely decorative — echoes the
 * marketing site's passport motif. Two 44-char lines of A–Z, 0–9 and `<`.
 */
export function mrzLines(params: {
  fellowNumber: number;
  displayName: string;
  username?: string | null;
  joinYear?: number;
}): [string, string] {
  const clean = (s: string) =>
    s
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "<")
      .slice(0, 40);

  const num = fmt(params.fellowNumber);
  const line1 = `P<CRACKED<<${clean(params.displayName)}`.padEnd(44, "<").slice(0, 44);
  const tail = `${params.username ? clean(params.username) : "FELLOW"}`;
  const yr = params.joinYear ?? new Date().getUTCFullYear();
  const line2 = `CRK${num}<<${yr}<<${tail}`.padEnd(44, "<").slice(0, 44);
  return [line1, line2];
}
