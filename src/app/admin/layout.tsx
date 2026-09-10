import { GuardedDashboardShell } from "@/components/dashboard/guarded-dashboard-shell";
import { adminDashboardNav } from "@/config/dashboard-nav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <GuardedDashboardShell title="Admin console" nav={adminDashboardNav} roles={["ADMIN"]}>
      {children}
    </GuardedDashboardShell>
  );
}
