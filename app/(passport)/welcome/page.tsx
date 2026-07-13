import { redirect } from "next/navigation";
import { getCurrentFellow } from "@/lib/auth";
import { WelcomeStep } from "@/components/claim/welcome-step";

export const dynamic = "force-dynamic";

export default async function WelcomePage() {
  const fellow = await getCurrentFellow();
  // Only self-serve fellows who haven't finished onboarding belong here.
  if (!fellow) redirect("/passport");
  if (fellow.status === "claimed" && fellow.username) redirect("/passport");

  const gh = fellow.links?.github;
  const defaultUsername = gh
    ? gh.replace(/\/+$/, "").split("/").pop() ?? fellow.display_name
    : fellow.display_name;

  return (
    <WelcomeStep fellowNumber={fellow.fellow_number} defaultUsername={defaultUsername} />
  );
}
