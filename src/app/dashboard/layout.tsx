import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { userDashboardNav } from "@/config/dashboard-nav";

export default function UserDashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell title="Guest workspace" nav={userDashboardNav}>{children}</DashboardShell>;
}
