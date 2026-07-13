export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-black/[0.06]">
      <div className="mx-auto flex max-w-[1320px] flex-col items-center justify-between gap-2 px-[clamp(20px,4vw,56px)] py-8 text-xs text-ink-4 sm:flex-row">
        <span className="font-pixel text-sm text-ink-3">
          crackedHQ<span className="text-moss">.</span>
        </span>
        <span className="eyebrow">A members-only builder community</span>
      </div>
    </footer>
  );
}
