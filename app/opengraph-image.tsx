import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt =
  "Learn2Earn, a Texas nonprofit helping people experiencing homelessness build life skills and earn verified incentives.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px 96px",
          background:
            "linear-gradient(135deg, #00467F 0%, #0C5DA5 55%, #2E7D32 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            fontSize: 32,
            fontWeight: 600,
            letterSpacing: 1,
            textTransform: "uppercase",
            opacity: 0.92,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "rgba(255,255,255,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
              fontWeight: 800,
            }}
          >
            L2
          </div>
          <span>Learn2Earn</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              fontSize: 88,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -1.5,
              maxWidth: 980,
            }}
          >
            A Hand Up,
            <br />
            Not a Handout.
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 400,
              lineHeight: 1.4,
              opacity: 0.92,
              maxWidth: 900,
            }}
          >
            Incentive-based learning for people experiencing homelessness,
            built with cities, shelters, and local partners.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 24,
            opacity: 0.85,
          }}
        >
          <span>A Texas nonprofit, 4 years in the community</span>
          <span style={{ fontWeight: 600 }}>learn2earn-usa.com</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
