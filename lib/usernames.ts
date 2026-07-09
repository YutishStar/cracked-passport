/**
 * Public passport handles live at passport.crackedhq.com/<username> — a root
 * dynamic segment. Any word added here is protected from being taken as a
 * handle. IMPORTANT: grow this list whenever a new top-level route is added,
 * or a fellow could shadow it.
 */
export const RESERVED_USERNAMES = new Set([
  "admin",
  "api",
  "apply",
  "about",
  "claim",
  "passport",
  "sign-in",
  "sign-up",
  "signin",
  "signup",
  "welcome",
  "verify",
  "creating",
  "fellows",
  "houses",
  "sponsors",
  "events",
  "settings",
  "support",
  "cracked",
  "crackedhq",
  "www",
  "app",
  "home",
  "help",
  "legal",
  "privacy",
  "terms",
  "static",
  "_next",
  "favicon",
]);

const USERNAME_RE = /^[a-z0-9](?:[a-z0-9-]{1,28})[a-z0-9]$/;

/** Turn any string into a candidate handle (does not guarantee uniqueness). */
export function slugifyUsername(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/^@/, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
}

export type UsernameCheck =
  | { ok: true; value: string }
  | { ok: false; reason: string };

/** Validate a handle's shape + reserved-word status (not DB uniqueness). */
export function validateUsername(input: string): UsernameCheck {
  const value = slugifyUsername(input);
  if (value.length < 3) {
    return { ok: false, reason: "Handles must be at least 3 characters." };
  }
  if (!USERNAME_RE.test(value)) {
    return {
      ok: false,
      reason: "Use lowercase letters, numbers, and hyphens only.",
    };
  }
  if (RESERVED_USERNAMES.has(value)) {
    return { ok: false, reason: "That handle is reserved." };
  }
  return { ok: true, value };
}
