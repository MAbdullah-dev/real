import { GuardedDashboardShell } from "@/components/dashboard/guarded-dashboard-shell";
import { agencyDashboardNav } from "@/config/dashboard-nav";
import { AGENCY_ROLES } from "@/server/roles";

export default function AgencyLayout({ children }: { children: React.ReactNode }) {
  return (
    <GuardedDashboardShell title="Agency console" nav={agencyDashboardNav} roles={AGENCY_ROLES}>
      {children}
    </GuardedDashboardShell>
  );
}
