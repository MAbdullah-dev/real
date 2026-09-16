/** Client-safe credential labels (no server-only imports). */
export const CREDENTIAL_LABELS = {
  national_id: "National ID (CNIC / Emirates ID)",
  tax_number: "Tax number (NTN / TRN)",
  business_registration: "Business / company registration",
  real_estate_license: "Real-estate licence / broker card",
  office_proof: "Office address proof",
  other: "Other document",
} as const;
