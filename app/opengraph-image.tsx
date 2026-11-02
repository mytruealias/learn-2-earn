import { ImageResponse } from "next/og";
export const runtime = "edge";
export const alt =
  "Learn2Earn — supported adult learning and clear program oversight";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 80px",
          background: "#faf8f3",
          color: "#172f38",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            fontSize: 36,
            fontWeight: 700,
            color: "#075d72",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 7,
              padding: 14,
              background: "#075d72",
              borderRadius: 16,
            }}
          >
            {[16, 28, 40].map((h) => (
              <div
                key={h}
                style={{
                  width: 8,
                  height: h,
                  background: "white",
                  borderRadius: 2,
                }}
              />
            ))}
          </div>
          Learn2Earn
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 76,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: -3,
            }}
          >
            Learning with support.
            <br />
            Progress with purpose.
          </div>
          <div style={{ fontSize: 28, lineHeight: 1.4 }}>
            Adult learning, program-defined incentives and human oversight.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            borderTop: "2px solid #bdccd0",
            paddingTop: 20,
            fontSize: 22,
            color: "#48626c",
          }}
        >
          For cities, shelters and community partners
        </div>
      </div>
    ),
    size,
  );
}
