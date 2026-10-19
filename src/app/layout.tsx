import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { site } from "@/lib/site";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "800"],
  display: "swap",
});

const description =
  "Find genuine scholarships in Uganda and East Africa for O-Level, A-Level, Bachelors and Postgraduate students. Register free in minutes and track every step.";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name}: scholarships in Uganda & East Africa | ${site.tagline}`, template: `%s | ${site.name}` },
  description,
  applicationName: site.name,
  keywords: ["scholarships Uganda", "scholarships East Africa", "O-Level scholarships", "A-Level scholarships", "bachelors scholarships", "postgraduate scholarships", "bursary Uganda", "Kampala"],
  openGraph: { type: "website", siteName: site.name, locale: "en_UG", title: `${site.name}: ${site.tagline}`, description },
  twitter: { card: "summary_large_image", title: `${site.name}: ${site.tagline}`, description },
  ...(process.env.NEXT_PUBLIC_GSC_VERIFICATION ? { verification: { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION } } : {}),
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: site.name,
  url: site.url,
  logo: `${site.url}/brand/Favicons-and-App-Icons/icon-512x512.png`,
  slogan: site.tagline,
  address: { "@type": "PostalAddress", streetAddress: "Mengo, P.O. Box 24930", addressLocality: "Kampala", addressCountry: "UG" },
  areaServed: ["UG", "KE", "TZ", "RW", "BI", "SS"],
};

export const viewport: Viewport = { themeColor: "#111111", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="min-h-screen flex flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-gold focus:text-ink focus:p-3">Skip to content</a>
        <Header />
        <main id="main" className="flex-1">{children}</main>
        <Footer />
        <Suspense fallback={null}><WhatsAppButton /></Suspense>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
      </body>
    </html>
  );
}
