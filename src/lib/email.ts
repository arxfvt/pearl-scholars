import "server-only";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Sends via Resend. Silently skips when RESEND_API_KEY is not set. Returns true if sent. */
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.RESEND_FROM ?? "Pearl Scholars <onboarding@resend.dev>",
        to,
        subject,
        html,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

const shell = (body: string) => `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#111">
<div style="background:#111;padding:16px 20px"><strong style="color:#fff;font-size:18px">Pearl Scholars</strong></div>
<div style="padding:20px;background:#faf7f0">${body}</div>
<p style="font-size:12px;color:#55524a;padding:0 20px">Your Fursa awaits.</p></div>`;

export function registrationEmail(name: string, scholarship: string, reference: string) {
  return {
    subject: `We received your registration (${reference})`,
    html: shell(`<p>Hello ${esc(name)},</p>
<p>Thank you for registering for <strong>${esc(scholarship)}</strong>.</p>
<p>Your reference number is:</p>
<p style="font-size:22px;font-weight:800;background:#fcdc04;display:inline-block;padding:8px 14px;border-radius:8px">${esc(reference)}</p>
<p>Keep it safe. We will email you whenever your status changes.</p>`),
  };
}

export function statusEmail(name: string, scholarship: string, reference: string, statusLabel: string) {
  return {
    subject: `Update on your registration (${reference})`,
    html: shell(`<p>Hello ${esc(name)},</p>
<p>The status of your registration for <strong>${esc(scholarship)}</strong> is now: <strong>${esc(statusLabel)}</strong>.</p>
<p>Reference: ${esc(reference)}</p>`),
  };
}
