import { requirePageRole } from "@/lib/authorization";
import EnquiryDetails from "@/features/enquiries/components/EnquiryDetails";
import AdminLayout from "@/app/admin/AdminLayout";

export const dynamic = "force-dynamic";
export const metadata = { title: "Enquiry details | VSource CMS" };

export default async function EnquiryDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageRole("EDITOR");
  const { id } = await params;
  return <AdminLayout name={user.name || user.email || "Administrator"} role={user.role} activeModule="enquiries" heading="Enquiry details"><EnquiryDetails id={id} role={user.role}/></AdminLayout>;
}
