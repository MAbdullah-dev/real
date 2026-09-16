import { GuardedDashboardShell } from "@/components/dashboard/guarded-dashboard-shell";
import { brokerDashboardNav } from "@/config/dashboard-nav";
import { BROKER_ROLES } from "@/server/roles";

export default function BrokerLayout({ children }: { children: React.ReactNode }) {
  return (
    <GuardedDashboardShell title="Broker console" nav={brokerDashboardNav} roles={BROKER_ROLES}>
      {children}
    </GuardedDashboardShell>
  );
}
