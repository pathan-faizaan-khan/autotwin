import { ImageResponse } from "next/og";

export const alt = "AutoTwin AI – AI-Powered Financial Automation";
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
          alignItems: "center",
          justifyContent: "center",
          background: "#09090b",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
        }}
      >
        {/* Top glow */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "80%",
            height: "50%",
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.25) 0%, transparent 70%)",
          }}
        />
        {/* Logo box */}
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 28,
            background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 40,
            boxShadow: "0 8px 64px rgba(124,58,237,0.5)",
          }}
        >
          <div style={{ fontSize: 52, color: "white" }}>⚡</div>
        </div>
        {/* Brand name */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: "#fafafa",
            letterSpacing: "-3px",
            marginBottom: 20,
          }}
        >
          AutoTwin AI
        </div>
        {/* Tagline */}
        <div
          style={{
            fontSize: 30,
            color: "#a1a1aa",
            textAlign: "center",
            maxWidth: 700,
            lineHeight: 1.4,
          }}
        >
          AI-Powered Financial Automation
        </div>
        {/* Pills */}
        <div style={{ display: "flex", gap: 16, marginTop: 48 }}>
          {["Invoice Processing", "Risk Prevention", "Financial Intelligence"].map(
            (tag) => (
              <div
                key={tag}
                style={{
                  padding: "10px 24px",
                  borderRadius: 100,
                  background: "rgba(124,58,237,0.15)",
                  border: "1px solid rgba(124,58,237,0.35)",
                  color: "#a78bfa",
                  fontSize: 20,
                  fontWeight: 600,
                }}
              >
                {tag}
              </div>
            )
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
