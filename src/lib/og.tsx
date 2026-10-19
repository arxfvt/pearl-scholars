import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };

const INK = "#111111";
const GOLD = "#FCDC04";
const RED = "#C8102E";
const IVORY = "#FAF7F0";

/** Brand share card: ink background, gold accents, cap mark, big title. Used for the site and for each scholarship. */
export function brandCard({ eyebrow, title, chips = [], footer }: { eyebrow: string; title: string; chips?: { text: string; tone?: "gold" | "red" | "outline" }[]; footer: string }) {
  const size = title.length > 70 ? 54 : title.length > 45 ? 64 : 76;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: INK, padding: "64px 72px", color: IVORY, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="64" height="64" viewBox="0 0 300 300">
            <path fill={IVORY} d="M88 150 V202 Q150 236 212 202 V150 L150 176 Z" />
            <polygon fill={IVORY} points="150,62 276,118 150,174 24,118" />
            <path d="M150 118 L246 132 V196" fill="none" stroke={GOLD} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="246" cy="214" r="22" fill={GOLD} />
            <circle cx="150" cy="118" r="12" fill={RED} />
          </svg>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 34, fontWeight: 800 }}>Pearl Scholars</span>
            <span style={{ fontSize: 22, color: GOLD }}>Your Fursa awaits.</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", width: 90, height: 8, background: RED, borderRadius: 4 }} />
          <span style={{ fontSize: 26, color: "#D9D4C7", textTransform: "uppercase", letterSpacing: 2 }}>{eyebrow}</span>
          <span style={{ fontSize: size, fontWeight: 800, lineHeight: 1.08, maxWidth: 1050 }}>{title}</span>
          {chips.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
              {chips.map((c) => (
                <span key={c.text} style={{
                  display: "flex", fontSize: 26, fontWeight: 700, padding: "10px 22px", borderRadius: 999,
                  background: c.tone === "gold" ? GOLD : c.tone === "red" ? RED : "transparent",
                  color: c.tone === "gold" ? INK : IVORY, border: c.tone === "outline" || !c.tone ? `2px solid ${IVORY}` : "none",
                }}>{c.text}</span>
              ))}
            </div>
          )}
        </div>

        <span style={{ fontSize: 26, color: "#D9D4C7" }}>{footer}</span>
      </div>
    ),
    ogSize,
  );
}
