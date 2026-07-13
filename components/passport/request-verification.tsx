"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";

/**
 * Self-serve verification request for a signed-in visitor who isn't a fellow
 * yet. Posts to /api/apply, which ties it to their Clerk account so approval
 * binds them directly.
 */
export function RequestVerification() {
  const { user } = useUser();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultName = user?.fullName ?? "";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      router.refresh(); // now they'll see the "under review" state
    } catch {
      setError("Something went wrong. Try again.");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col justify-center px-6 py-16">
      <p className="eyebrow mb-4">Request verification</p>
      <h1 className="font-display text-3xl text-ink">
        Tell us who you are.
      </h1>
      <p className="mt-3 mb-8 text-ink-3">
        Every Cracked Fellow is reviewed by hand. Share your work and we&apos;ll
        verify you for your Passport.
      </p>

      <motion.form
        onSubmit={onSubmit}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-5"
      >
        <input type="text" name="company" tabIndex={-1} autoComplete="off" className="absolute left-[-9999px]" aria-hidden />
        <Field name="name" label="Your name" defaultValue={defaultName} required />
        <Field name="github_url" label="GitHub" placeholder="https://github.com/you" />
        <Field name="x" label="X / Twitter" placeholder="@you" />
        <Field name="building" label="What are you building?" textarea />
        <Field name="why" label="Why Cracked?" textarea />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-ink py-3.5 text-sm text-paper transition-transform hover:-translate-y-px disabled:opacity-50"
        >
          {submitting ? "Sending…" : "Submit for verification"}
        </button>
      </motion.form>
    </main>
  );
}

function Field({
  name,
  label,
  type = "text",
  placeholder,
  defaultValue,
  required,
  textarea,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
  textarea?: boolean;
}) {
  const cls =
    "w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-ink placeholder:text-ink-4 outline-none transition-colors focus:border-ink/40";
  return (
    <label className="block">
      <span className="eyebrow mb-2 block">{label}</span>
      {textarea ? (
        <textarea name={name} placeholder={placeholder} rows={3} className={cls} />
      ) : (
        <input name={name} type={type} defaultValue={defaultValue} placeholder={placeholder} required={required} className={cls} />
      )}
    </label>
  );
}
