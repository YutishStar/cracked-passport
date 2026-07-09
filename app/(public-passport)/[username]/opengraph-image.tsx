import { ImageResponse } from "next/og";
import { getFellowByUsername } from "@/lib/supabase/queries/fellows";
import { fmt } from "@/lib/copy";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const fellow = await getFellowByUsername(username);
  const name = fellow?.display_name ?? "Cracked Fellow";
  const number = fellow ? fmt(fellow.fellow_number) : "000";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(150deg,#12140f 0%,#1c1f17 55%,#0f120c 100%)",
          color: "#fafaf7",
          padding: 80,
          fontFamily: "serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 26, letterSpacing: 8, color: "#8b8b88" }}>
          CRACKED · PASSPORT
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 84, lineHeight: 1 }}>{name}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 24 }}>
            <div
              style={{
                display: "flex",
                background: "rgba(61,107,78,0.3)",
                color: "#9fd4ac",
                borderRadius: 999,
                padding: "8px 20px",
                fontSize: 26,
                fontFamily: "sans-serif",
              }}
            >
              Verified Fellow
            </div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", fontSize: 120, lineHeight: 1 }}>
          #{number}
        </div>
      </div>
    ),
    { ...size },
  );
}
