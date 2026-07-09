import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-paper px-6 text-center">
      <p className="font-pixel text-6xl text-ink">404</p>
      <p className="mt-3 text-ink-3">This page doesn&apos;t exist.</p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-ink px-6 py-3 text-sm text-paper transition-transform hover:-translate-y-px"
      >
        Back home
      </Link>
    </main>
  );
}
