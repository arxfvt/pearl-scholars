import { getAdmin } from "@/lib/auth";
import { queryRegistrations, filtersFrom } from "@/lib/data/registrations";
import { levelLabels, statusLabels } from "@/lib/types";

/** CSV download of the filtered registrations. Opens directly in Excel (UTF-8 BOM). Admins only. */
export async function GET(request: Request) {
  if (!(await getAdmin())) return new Response("Not authorised", { status: 403 });
  const sp = Object.fromEntries(new URL(request.url).searchParams);
  const { rows } = await queryRegistrations(filtersFrom(sp), { paginate: false });

  // Prevent spreadsheet formula injection from user-entered text.
  const cell = (v: unknown) => {
    let s = v == null ? "" : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const header = [
    "Reference", "Date (Kampala)", "Scholarship", "Status", "Full name", "Email", "Phone", "Gender", "Date of birth",
    "Level", "Current class", "School / institution", "District", "Latest results", "Guardian name", "Guardian phone",
    "Special needs", "Heard from", "UTM source", "UTM medium", "UTM campaign",
  ];
  const kampala = new Intl.DateTimeFormat("en-GB", { dateStyle: "short", timeStyle: "short", timeZone: "Africa/Kampala" });
  const lines = rows.map((r) => [
    r.reference, kampala.format(new Date(r.created_at)), r.scholarships?.title, statusLabels[r.status], r.full_name, r.email, r.phone,
    r.gender?.replace(/_/g, " "), r.date_of_birth, levelLabels[r.level], r.current_class, r.institution, r.district, r.exam_results,
    r.guardian_name, r.guardian_phone, r.special_needs, r.heard_from, r.utm_source, r.utm_medium, r.utm_campaign,
  ].map(cell).join(","));

  const csv = "﻿" + [header.map(cell).join(","), ...lines].join("\r\n");
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pearl-scholars-registrations-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
