import { GuardedDashboardShell } from "@/components/dashboard/guarded-dashboard-shell";
import { userDashboardNav } from "@/config/dashboard-nav";
import { BUYER_ROLES } from "@/server/roles";

export default function UserDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <GuardedDashboardShell title="Buyer workspace" nav={userDashboardNav} roles={BUYER_ROLES}>
      {children}
    </GuardedDashboardShell>
  );
}
