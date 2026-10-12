import Link from "next/link";
import ScholarshipForm, { emptyScholarship } from "@/components/admin/ScholarshipForm";

export default function Page() {
  return (
    <>
      <Link href="/admin/scholarships" className="text-sm underline">&larr; All scholarships</Link>
      <h1 className="mb-6 mt-2 text-3xl">Add scholarship</h1>
      <ScholarshipForm id={null} initial={emptyScholarship} coverUrl={null} />
    </>
  );
}
