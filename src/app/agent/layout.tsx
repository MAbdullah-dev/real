import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { agentDashboardNav } from "@/config/dashboard-nav";

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell title="Agent console" nav={agentDashboardNav}>{children}</DashboardShell>;
}
