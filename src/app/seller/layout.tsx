import { GuardedDashboardShell } from "@/components/dashboard/guarded-dashboard-shell";
import { sellerDashboardNav } from "@/config/dashboard-nav";
import { SELLER_ROLES } from "@/server/roles";

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <GuardedDashboardShell title="Seller console" nav={sellerDashboardNav} roles={SELLER_ROLES}>
      {children}
    </GuardedDashboardShell>
  );
}
