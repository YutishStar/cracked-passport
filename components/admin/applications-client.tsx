"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { approveApplication, rejectApplication } from "@/app/(admin)/yutish/actions";
import type { Application } from "@/lib/supabase/types";

export function ApplicationsClient({ applications }: { applications: Application[] }) {
  const [items, setItems] = useState(applications);
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  function onApprove(app: Application) {
    setBusyId(app.id);
    startTransition(async () => {
      try {
        const res = await approveApplication(app.id);
        setItems((cur) => cur.filter((a) => a.id !== app.id));
        if (res.selfServe) {
          toast.success(`Approved as Fellow #${res.fellowNumber}.`, {
            description: res.emailed
              ? "Email sent — they can open their Passport."
              : "They can open their Passport now.",
          });
        } else if (res.emailed) {
          toast.success(`Approved as Fellow #${res.fellowNumber}. Email sent.`);
        } else {
          toast.success(`Approved as Fellow #${res.fellowNumber}.`, {
            description: "Copy the claim link for them.",
            action: {
              label: "Copy link",
              onClick: () => res.claimUrl && navigator.clipboard.writeText(res.claimUrl),
            },
            duration: 10000,
          });
        }
      } catch {
        toast.error("Failed to approve.");
      } finally {
        setBusyId(null);
      }
    });
  }

  function onReject(app: Application) {
    setBusyId(app.id);
    startTransition(async () => {
      try {
        await rejectApplication(app.id);
        setItems((cur) => cur.filter((a) => a.id !== app.id));
        toast("Application rejected.");
      } catch {
        toast.error("Failed to reject.");
      } finally {
        setBusyId(null);
      }
    });
  }

  if (items.length === 0) {
    return <p className="mt-10 text-ink-3">No pending applications.</p>;
  }

  return (
    <div className="mt-8 space-y-3">
      {items.map((app) => (
        <div
          key={app.id}
          className="rounded-2xl border border-black/[0.06] bg-white p-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="font-medium text-ink">{app.name}</div>
              <div className="text-sm text-ink-3">{app.email}</div>
              {app.github_url && (
                <a
                  href={app.github_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-moss underline"
                >
                  {app.github_url}
                </a>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => onReject(app)}
                disabled={pending && busyId === app.id}
                className="rounded-full border border-black/10 px-4 py-2 text-sm text-ink-2 hover:bg-black/[0.03] disabled:opacity-50"
              >
                Reject
              </button>
              <button
                onClick={() => onApprove(app)}
                disabled={pending && busyId === app.id}
                className="rounded-full bg-ink px-4 py-2 text-sm text-paper disabled:opacity-50"
              >
                {busyId === app.id ? "…" : "Approve"}
              </button>
            </div>
          </div>
          {(app.answers?.building || app.answers?.why) && (
            <div className="mt-4 space-y-2 border-t border-black/[0.06] pt-4 text-sm text-ink-2">
              {app.answers.building && (
                <p>
                  <span className="eyebrow mr-2">Building</span>
                  {app.answers.building}
                </p>
              )}
              {app.answers.why && (
                <p>
                  <span className="eyebrow mr-2">Why</span>
                  {app.answers.why}
                </p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
