import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/seo";

export const alt = `${siteConfig.name} — AI UGC Ads & Cinematic Commercials`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background:
            "radial-gradient(circle at 30% 0%, #2a1c12 0%, #0b0a0c 55%)",
          color: "#f6f5f3",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: "#ff6a39",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              fontWeight: 700,
              color: "#0b0a09",
            }}
          >
            B
          </div>
          <span style={{ fontSize: 30, fontWeight: 600 }}>
            {siteConfig.name}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 60, fontWeight: 600, lineHeight: 1.1, maxWidth: 900 }}>
            Your product. A full ad campaign. By tomorrow morning.
          </div>
          <div style={{ fontSize: 26, color: "#a5a5ae", maxWidth: 780 }}>
            AI-generated UGC ads and cinematic commercials from a single
            product photo.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
