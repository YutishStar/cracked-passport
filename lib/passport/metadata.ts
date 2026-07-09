import "server-only";
import { loadPassport } from "@/lib/supabase/queries/passport";
import { fmt } from "@/lib/copy";
import { env } from "@/lib/env";

/** Build the token metadata JSON for a fellow (ERC-721 metadata shape). */
export async function buildMetadata(fellowId: string) {
  const view = await loadPassport(fellowId);
  if (!view) throw new Error("fellow not found");
  const f = view.fellow;

  const image = f.username
    ? `${env.appUrl.replace(/\/$/, "")}/${f.username}/opengraph-image`
    : undefined;

  return {
    name: `Cracked Fellow #${fmt(f.fellow_number)}`,
    description: `The lifelong Cracked Passport of ${f.display_name}.`,
    image,
    external_url: f.username
      ? `${env.appUrl.replace(/\/$/, "")}/${f.username}`
      : undefined,
    attributes: [
      { trait_type: "Fellow Number", value: f.fellow_number },
      { trait_type: "Join Year", value: new Date(f.created_at).getUTCFullYear() },
      { trait_type: "Houses", value: view.stamps.length },
      { trait_type: "Achievements", value: view.achievements.length },
      ...(view.currentHouse
        ? [{ trait_type: "Current House", value: view.currentHouse.name }]
        : []),
    ],
  };
}
