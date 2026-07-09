import { listApplications } from "@/lib/supabase/queries/applications";
import { ApplicationsClient } from "@/components/admin/applications-client";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  const applications = await listApplications("pending");
  return (
    <div>
      <h1 className="font-display text-4xl text-ink">Applications</h1>
      <p className="mt-2 text-ink-3">Review each one by hand.</p>
      <ApplicationsClient applications={applications} />
    </div>
  );
}
