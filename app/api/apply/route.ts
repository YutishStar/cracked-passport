import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createApplication } from "@/lib/supabase/queries/applications";

const schema = z.object({
  name: z.string().min(2).max(120),
  // Username-only auth — email is optional (and usually absent).
  email: z.string().email().max(200).optional().or(z.literal("")),
  github_url: z.string().url().max(300).optional().or(z.literal("")),
  x: z.string().max(300).optional().or(z.literal("")),
  building: z.string().max(2000).optional().or(z.literal("")),
  why: z.string().max(2000).optional().or(z.literal("")),
  // Honeypot — bots fill it, humans never see it.
  company: z.string().max(0).optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid application" }, { status: 422 });
  }
  const d = parsed.data;
  if (d.company) {
    // Honeypot tripped — pretend success, drop silently.
    return NextResponse.json({ ok: true });
  }

  // If signed in, tie the request to the Clerk account so approval binds the
  // fellow directly to this user (self-serve verification). Username-only auth,
  // so email is whatever the form gave us (usually none).
  const { userId } = await auth();
  // Prefer the email they typed; fall back to a Clerk email if one exists.
  let email: string | null = d.email || null;
  if (!email && userId) {
    const user = await currentUser();
    email = user?.primaryEmailAddress?.emailAddress ?? null;
  }

  try {
    await createApplication({
      name: d.name,
      email,
      github_url: d.github_url || null,
      links: d.x ? { x: d.x } : {},
      answers: {
        ...(d.building ? { building: d.building } : {}),
        ...(d.why ? { why: d.why } : {}),
      },
      clerk_user_id: userId ?? null,
    });
  } catch (err: unknown) {
    // Duplicate email → still report success (don't leak who's applied).
    const code = (err as { code?: string })?.code;
    if (code === "23505") return NextResponse.json({ ok: true });
    console.error("apply error", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
