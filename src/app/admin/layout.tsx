import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { adminDashboardNav } from "@/config/dashboard-nav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell title="Admin console" nav={adminDashboardNav}>{children}</DashboardShell>;
}
