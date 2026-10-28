/** Admin setting catalog. Stored rows are seeded from this list. */

export const ADMIN_SETTINGS = [
  {
    key: "allowBrokerSignup",
    label: "Allow broker self-signup",
    description: "Let platform brokers register to handle seller-property buyers.",
  },
  {
    key: "allowAgencySignup",
    label: "Allow agency self-signup",
    description: "Let real-estate agencies register.",
  },
  {
    key: "allowSellerSignup",
    label: "Allow seller self-signup",
    description: "Let property owners register and list their own homes.",
  },
  {
    key: "maintenanceBanner",
    label: "Show maintenance banner",
    description: "Display a site-wide notice about scheduled work.",
  },
] as const;

export type AdminSettingKey = (typeof ADMIN_SETTINGS)[number]["key"];

/** Keys that are on when no row has been stored yet. */
export const ADMIN_SETTINGS_DEFAULT_ON: readonly AdminSettingKey[] = [
  "allowBrokerSignup",
  "allowAgencySignup",
  "allowSellerSignup",
];
