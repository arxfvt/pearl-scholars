import "server-only";

/** Reads Supabase's public auth settings so the Google button only shows once Google is switched on in the dashboard. */
export async function isGoogleEnabled(): Promise<boolean> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
      signal: AbortSignal.timeout(3000),
    });
    const data = (await res.json()) as { external?: Record<string, boolean> };
    return data.external?.google === true;
  } catch {
    return false;
  }
}
