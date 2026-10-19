import { brandCard, ogSize } from "@/lib/og";

export const alt = "Pearl Scholars: genuine scholarships in Uganda and East Africa";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return brandCard({
    eyebrow: "Scholarships in Uganda & East Africa",
    title: "Find genuine scholarships and register free in minutes.",
    chips: [{ text: "O-Level", tone: "outline" }, { text: "A-Level", tone: "outline" }, { text: "Bachelors", tone: "outline" }, { text: "Postgraduate", tone: "outline" }],
    footer: "pearlscholarsfursa.com",
  });
}
