import { requirePageRole } from "@/lib/authorization";
import EnquiryDashboard from "@/features/enquiries/components/EnquiryDashboard";
import AdminLayout from "@/app/admin/AdminLayout";

export const dynamic = "force-dynamic";
export const metadata = { title: "Enquiries | VSource CMS" };

export default async function EnquiriesPage() {
  const user = await requirePageRole("EDITOR");
  return <AdminLayout name={user.name || user.email || "Administrator"} role={user.role} activeModule="enquiries"><EnquiryDashboard role={user.role}/></AdminLayout>;
}
