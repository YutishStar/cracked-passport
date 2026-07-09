import { clerkMiddleware } from "@clerk/nextjs/server";

/**
 * We run clerkMiddleware so `auth()` is available everywhere, but we do NOT
 * force redirects here. Route-group layouts own the gating so we can render a
 * branded FellowGate / admin 404 instead of a raw sign-in bounce:
 *   - (passport)/layout.tsx  → FellowGate when signed out
 *   - (admin)/layout.tsx     → notFound() when not an admin
 */
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next internals and static files, run on everything else.
    "/((?!_next|.*\\..*).*)",
    "/(api)(.*)",
  ],
};
