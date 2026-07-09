"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { copy } from "@/lib/copy";

export function ApplyForm() {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setDone(true);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence mode="wait">
      {done ? (
        <motion.div
          key="done"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-black/[0.06] bg-white p-10 text-center"
        >
          <p className="font-display text-3xl text-ink">Thank you.</p>
          <p className="mt-3 text-ink-3">{copy.apply.success}</p>
        </motion.div>
      ) : (
        <motion.form
          key="form"
          onSubmit={onSubmit}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-5"
        >
          {/* Honeypot */}
          <input
            type="text"
            name="company"
            tabIndex={-1}
            autoComplete="off"
            className="absolute left-[-9999px]"
            aria-hidden="true"
          />

          <Field name="name" label="Your name" required />
          <Field name="email" type="email" label="Email" required />
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
            {submitting ? "Sending…" : copy.apply.submit}
          </button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}

function Field({
  name,
  label,
  type = "text",
  placeholder,
  required,
  textarea,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
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
        <input
          name={name}
          type={type}
          placeholder={placeholder}
          required={required}
          className={cls}
        />
      )}
    </label>
  );
}
