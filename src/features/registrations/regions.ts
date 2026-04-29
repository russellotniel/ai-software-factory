// @spec: submit-registration
// @urs: UR-01, UR-02

// Indonesian provinces relevant to XLSmart prepaid SIM operations.
// Display names are Bahasa Indonesia where conventional.
//
// In production this list is sourced from the existing dealer-registry
// service (out of scope for v1); for the Kominfo demo we hardcode the
// covered regions.
export const REGIONS = [
  { code: 'DKI-JAKARTA', label: 'DKI Jakarta' },
  { code: 'JABAR', label: 'Jawa Barat' },
  { code: 'BANTEN', label: 'Banten' },
  { code: 'JATENG', label: 'Jawa Tengah' },
  { code: 'DIY', label: 'DI Yogyakarta' },
  { code: 'JATIM', label: 'Jawa Timur' },
  { code: 'BALI', label: 'Bali' },
  { code: 'SUMUT', label: 'Sumatera Utara' },
  { code: 'SUMSEL', label: 'Sumatera Selatan' },
  { code: 'SULSEL', label: 'Sulawesi Selatan' },
] as const;

export type RegionCode = (typeof REGIONS)[number]['code'];
