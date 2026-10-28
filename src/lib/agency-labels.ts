import type { AgencyType, CredentialType } from "@prisma/client";

/** Client-safe credential labels (no server-only imports). */
export const CREDENTIAL_LABELS = {
  national_id: "National ID (CNIC / Emirates ID)",
  tax_number: "Tax number (NTN / TRN)",
  business_registration: "Business / company registration",
  real_estate_license: "Real-estate licence / broker card",
  office_proof: "Office address proof",
  other: "Other document",
} as const;

/** Country-keyed required docs. Pakistan-first; generic fallback for abroad. */
export function requiredCredentialTypes(
  country: string | null | undefined,
  type: AgencyType
): CredentialType[] {
  const code = (country ?? "PK").toUpperCase();
  if (code === "PK") {
    const required: CredentialType[] = ["national_id"];
    if (type !== "individual") required.push("business_registration");
    return required;
  }
  const required: CredentialType[] = ["national_id", "real_estate_license"];
  if (type !== "individual") required.push("business_registration");
  return required;
}
