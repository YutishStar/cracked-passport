"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { saveProfile } from "@/app/(passport)/actions";
import { copy } from "@/lib/copy";
import type { Fellow } from "@/lib/supabase/types";

export function EditProfileSheet({ fellow }: { fellow: Fellow }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    bio: fellow.bio ?? "",
    current_startup: fellow.current_startup ?? "",
    github: fellow.links?.github ?? "",
    linkedin: fellow.links?.linkedin ?? "",
    x: fellow.links?.x ?? "",
    portfolio: fellow.links?.portfolio ?? "",
  });

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function onSave() {
    startTransition(async () => {
      try {
        await saveProfile({
          bio: form.bio || null,
          current_startup: form.current_startup || null,
          links: {
            github: form.github || undefined,
            linkedin: form.linkedin || undefined,
            x: form.x || undefined,
            portfolio: form.portfolio || undefined,
          },
        });
        toast.success("Profile saved.");
        setOpen(false);
      } catch {
        toast.error("Couldn't save.");
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="rounded-full border border-black/10 px-4 py-2 text-sm text-ink-2 transition-colors hover:bg-black/[0.03]">
        {copy.passport.editProfile}
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">
            {copy.passport.editProfile}
          </SheetTitle>
        </SheetHeader>
        <div className="space-y-4 px-4 pb-8">
          <Field label="Bio" value={form.bio} onChange={(v) => set("bio", v)} textarea />
          <Field
            label="Current startup"
            value={form.current_startup}
            onChange={(v) => set("current_startup", v)}
          />
          <Field label="GitHub" value={form.github} onChange={(v) => set("github", v)} />
          <Field label="LinkedIn" value={form.linkedin} onChange={(v) => set("linkedin", v)} />
          <Field label="X / Twitter" value={form.x} onChange={(v) => set("x", v)} />
          <Field label="Portfolio" value={form.portfolio} onChange={(v) => set("portfolio", v)} />
          <button
            onClick={onSave}
            disabled={pending}
            className="w-full rounded-full bg-ink py-3 text-sm text-paper disabled:opacity-50"
          >
            {pending ? "Saving…" : copy.passport.save}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Field({
  label,
  value,
  onChange,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
}) {
  const cls =
    "w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-ink outline-none focus:border-ink/40";
  return (
    <label className="block">
      <span className="eyebrow mb-1.5 block">{label}</span>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className={cls} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} className={cls} />
      )}
    </label>
  );
}
