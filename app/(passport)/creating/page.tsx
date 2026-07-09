import { requireFellow } from "@/lib/auth";
import { PassportCreating } from "@/components/claim/passport-creating";

export default async function CreatingPage() {
  const fellow = await requireFellow();
  return <PassportCreating fellowNumber={fellow.fellow_number} />;
}
