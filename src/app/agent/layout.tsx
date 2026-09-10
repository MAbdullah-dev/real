import { GuardedDashboardShell } from "@/components/dashboard/guarded-dashboard-shell";
import { agentDashboardNav } from "@/config/dashboard-nav";

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return (
    <GuardedDashboardShell title="Agent console" nav={agentDashboardNav} roles={["AGENT", "ADMIN"]}>
      {children}
    </GuardedDashboardShell>
  );
}
