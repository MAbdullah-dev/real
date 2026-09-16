export type DashboardNavItem = {
  href: string;
  label: string;
  section?: string;
};

export const userDashboardNav: DashboardNavItem[] = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/saved", label: "Saved properties" },
  { href: "/dashboard/viewings", label: "Viewings" },
  { href: "/dashboard/messages", label: "Messages" },
  { href: "/dashboard/notifications", label: "Notifications" },
  { href: "/dashboard/settings", label: "Settings" },
];

export const agencyDashboardNav: DashboardNavItem[] = [
  { href: "/agency", label: "Overview" },
  { href: "/agency/properties", label: "All listings", section: "Listings" },
  { href: "/agency/viewings", label: "Viewings", section: "Pipeline" },
  { href: "/agency/messages", label: "Enquiries", section: "Pipeline" },
  { href: "/agency/analytics", label: "Performance", section: "Insights" },
  { href: "/agency/profile", label: "Agency profile", section: "Account" },
  { href: "/agency/subscription", label: "Subscription", section: "Account" },
];

export const brokerDashboardNav: DashboardNavItem[] = [
  { href: "/broker", label: "Overview" },
  { href: "/broker/properties", label: "My listings", section: "Work" },
  { href: "/broker/viewings", label: "Viewings", section: "Work" },
  { href: "/broker/messages", label: "Enquiries", section: "Work" },
  { href: "/broker/profile", label: "Broker profile", section: "Account" },
];

export const sellerDashboardNav: DashboardNavItem[] = [
  { href: "/seller", label: "Overview" },
  { href: "/seller/properties", label: "My listings", section: "Listings" },
  { href: "/seller/viewings", label: "Viewings", section: "Pipeline" },
  { href: "/seller/messages", label: "Enquiries", section: "Pipeline" },
  { href: "/seller/profile", label: "Seller profile", section: "Account" },
];

export const adminDashboardNav = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/agencies", label: "Agencies" },
  { href: "/admin/brokers", label: "Brokers" },
  { href: "/admin/sellers", label: "Sellers" },
  { href: "/admin/properties", label: "Properties" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/subscriptions", label: "Subscriptions" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/cms", label: "CMS" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/settings", label: "Settings" },
];
