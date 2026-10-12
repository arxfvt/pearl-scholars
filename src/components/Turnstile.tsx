"use client";
import Script from "next/script";

/** Renders the Cloudflare Turnstile widget when a site key is configured. The token is read from the form field `cf-turnstile-response`. */
export default function Turnstile() {
  const key = process.env.NEXT_PUBLIC_TURNSTILE_KEY;
  if (!key) return null;
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" />
      <div className="cf-turnstile" data-sitekey={key} />
    </>
  );
}

export function readTurnstile(form: HTMLFormElement): string | null {
  const el = form.elements.namedItem("cf-turnstile-response") as HTMLInputElement | null;
  return el?.value || null;
}
