import Link from "next/link";
import TestimonialForm, { emptyTestimonial } from "@/components/admin/TestimonialForm";

export default function Page() {
  return (
    <>
      <Link href="/admin/testimonials" className="text-sm underline">&larr; All stories</Link>
      <h1 className="mb-6 mt-2 text-3xl">Add success story</h1>
      <TestimonialForm id={null} initial={emptyTestimonial} photoUrl={null} />
    </>
  );
}
