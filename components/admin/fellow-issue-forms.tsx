"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  issueStamp,
  issueAchievement,
  assignPerk,
  setResidency,
  resendWelcomeEmail,
} from "@/app/(admin)/yutish/actions";
import type { House, StampType, AchievementType, Perk } from "@/lib/supabase/types";

interface Props {
  fellowId: string;
  houses: House[];
  stampTypes: StampType[];
  achievementTypes: AchievementType[];
  perks: (Perk & { sponsor: { name: string } | null })[];
}

export function FellowIssueForms({
  fellowId,
  houses,
  stampTypes,
  achievementTypes,
  perks,
}: Props) {
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<unknown>, ok: string) {
    startTransition(async () => {
      try {
        await fn();
        toast.success(ok);
      } catch {
        toast.error("Failed.");
      }
    });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Picker
        title="Issue Stamp"
        options={stampTypes.map((s) => ({ id: s.id, label: s.name }))}
        disabled={pending}
        onPick={(id) => run(() => issueStamp(fellowId, id), "Stamp issued.")}
      />
      <Picker
        title="Issue Achievement"
        options={achievementTypes.map((a) => ({ id: a.id, label: a.name }))}
        disabled={pending}
        onPick={(id) => run(() => issueAchievement(fellowId, id), "Achievement issued.")}
      />
      <Picker
        title="Assign Perk"
        options={perks.map((p) => ({
          id: p.id,
          label: p.sponsor ? `${p.name} · ${p.sponsor.name}` : p.name,
        }))}
        disabled={pending}
        onPick={(id) => run(() => assignPerk(fellowId, id), "Perk assigned.")}
      />
      <Picker
        title="Set Current House"
        options={houses.map((h) => ({ id: h.id, label: `${h.flag ?? ""} ${h.name}` }))}
        disabled={pending}
        onPick={(id) =>
          run(
            () => setResidency(fellowId, id, new Date().toISOString().slice(0, 10)),
            "House set.",
          )
        }
      />
      <div className="sm:col-span-2">
        <button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              try {
                const res = await resendWelcomeEmail(fellowId);
                if (res.emailed) toast.success("Welcome email sent.");
                else if (res.reason === "no-email")
                  toast("This fellow has no email on file.");
                else toast.error("Email failed to send — check the server logs.");
              } catch {
                toast.error("Failed.");
              }
            })
          }
          className="rounded-full border border-black/10 px-5 py-2.5 text-sm text-ink-2 hover:bg-black/[0.03] disabled:opacity-50"
        >
          Resend welcome email
        </button>
      </div>
    </div>
  );
}

function Picker({
  title,
  options,
  onPick,
  disabled,
}: {
  title: string;
  options: { id: string; label: string }[];
  onPick: (id: string) => void;
  disabled: boolean;
}) {
  const [value, setValue] = useState("");
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white p-5">
      <p className="eyebrow mb-3">{title}</p>
      <div className="flex gap-2">
        <select
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none"
        >
          <option value="">Select…</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          disabled={disabled || !value}
          onClick={() => value && onPick(value)}
          className="rounded-lg bg-ink px-4 py-2 text-sm text-paper disabled:opacity-40"
        >
          Add
        </button>
      </div>
    </div>
  );
}
