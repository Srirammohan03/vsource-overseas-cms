// src\app\admin\page.next.tsx
import { requirePageRole } from "@/lib/authorization";
import { adminNavigation, type AdminModule } from "@/app/admin/admin-navigation";
import AdminDashboard from "./ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "VSource CMS" };

interface AdminPageProps {
  searchParams: Promise<{
    module?: string;
  }>;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const user = await requirePageRole("EDITOR");
  const params = await searchParams;

  const requestedModule = params.module;

  const validModule = adminNavigation.find(
    (item) => item.id === requestedModule,
  );

  const initialModule: AdminModule = validModule ? validModule.id : "dashboard";

  return (
    <AdminDashboard
      name={user.name || user.email || "Administrator"}
      role={user.role}
      initialModule={initialModule}
    />
  );
}
