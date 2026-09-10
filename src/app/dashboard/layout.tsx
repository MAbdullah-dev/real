import { GuardedDashboardShell } from "@/components/dashboard/guarded-dashboard-shell";
import { userDashboardNav } from "@/config/dashboard-nav";

export default function UserDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <GuardedDashboardShell title="Guest workspace" nav={userDashboardNav} roles={["USER", "AGENT", "ADMIN"]}>
      {children}
    </GuardedDashboardShell>
  );
}
