/**
 * Indian Goods and Services Tax (GST) Validation & Utility Module
 * Compliant with GSTN (Goods and Services Tax Network) standards.
 */

export interface GSTStateCode {
  code: string;
  name: string;
}

export const GST_STATE_CODES: GSTStateCode[] = [
  { code: '01', name: 'Jammu and Kashmir' },
  { code: '02', name: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab' },
  { code: '04', name: 'Chandigarh' },
  { code: '05', name: 'Uttarakhand' },
  { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi' },
  { code: '08', name: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '10', name: 'Bihar' },
  { code: '11', name: 'Sikkim' },
  { code: '12', name: 'Arunachal Pradesh' },
  { code: '13', name: 'Nagaland' },
  { code: '14', name: 'Manipur' },
  { code: '15', name: 'Mizoram' },
  { code: '16', name: 'Tripura' },
  { code: '17', name: 'Meghalaya' },
  { code: '18', name: 'Assam' },
  { code: '19', name: 'West Bengal' },
  { code: '20', name: 'Jharkhand' },
  { code: '21', name: 'Odisha' },
  { code: '22', name: 'Chhattisgarh' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '24', name: 'Gujarat' },
  { code: '26', name: 'Dadra and Nagar Haveli and Daman and Diu' },
  { code: '27', name: 'Maharashtra' },
  { code: '28', name: 'Andhra Pradesh (Old)' },
  { code: '29', name: 'Karnataka' },
  { code: '30', name: 'Goa' },
  { code: '31', name: 'Lakshadweep' },
  { code: '32', name: 'Kerala' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '34', name: 'Puducherry' },
  { code: '35', name: 'Andaman and Nicobar Islands' },
  { code: '36', name: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh (New)' },
  { code: '38', name: 'Ladakh' },
  { code: '97', name: 'Other Territory' },
  { code: '99', name: 'Centre Jurisdiction' },
];

/**
 * Standard Indian GSTIN Checksum calculation (Mod-36 algorithm per GSTN spec).
 * Characters: 0-9 (values 0-9), A-Z (values 10-35)
 * Multiplier alternates between 1 and 2.
 */
const GST_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function calculateGSTINChecksum(gstin14: string): string | null {
  if (!gstin14 || gstin14.length < 14) return null;
  const cleanStr = gstin14.substring(0, 14).toUpperCase();

  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const char = cleanStr[i];
    const charValue = GST_CHARS.indexOf(char);
    if (charValue === -1) return null;

    // Weight factor: 1 for even index (0, 2, 4...), 2 for odd index (1, 3, 5...)
    const factor = (i % 2 === 0) ? 1 : 2;
    const product = charValue * factor;

    // Add quotient and remainder of division by 36
    const quotient = Math.floor(product / 36);
    const remainder = product % 36;
    sum += quotient + remainder;
  }

  const checkCode = (36 - (sum % 36)) % 36;
  return GST_CHARS[checkCode] || null;
}

export interface GSTValidationResult {
  isValid: boolean;
  formatValid: boolean;
  checksumValid: boolean;
  stateCode?: string;
  stateName?: string;
  pan?: string;
  expectedChecksum?: string;
  actualChecksum?: string;
  error?: string;
}

/**
 * Validates a 15-character GSTIN against GSTN format and checksum rules.
 */
export function validateGSTIN(rawGstin: string): GSTValidationResult {
  if (!rawGstin) {
    return { isValid: false, formatValid: false, checksumValid: false, error: 'GSTIN is required' };
  }

  const gstin = rawGstin.trim().toUpperCase();

  if (gstin.length !== 15) {
    return {
      isValid: false,
      formatValid: false,
      checksumValid: false,
      error: `GSTIN must be exactly 15 characters (currently ${gstin.length})`,
    };
  }

  // Regex for 15-character GSTIN:
  // 2 digits state code + 10 chars PAN + 1 entity code (1-9 or A-Z) + 'Z' + 1 checksum char (0-9 or A-Z)
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;
  if (!gstinRegex.test(gstin)) {
    return {
      isValid: false,
      formatValid: false,
      checksumValid: false,
      error: 'Invalid GSTIN structure. Expected: 2-digit State + 10-char PAN + Entity + Z + Checksum',
    };
  }

  const stateCode = gstin.substring(0, 2);
  const pan = gstin.substring(2, 12);
  const stateMatch = GST_STATE_CODES.find((s) => s.code === stateCode);

  if (!stateMatch) {
    return {
      isValid: false,
      formatValid: false,
      checksumValid: false,
      error: `Invalid state code '${stateCode}'. Must be a valid Indian GST state code (01-38, 97, 99).`,
    };
  }

  const actualChecksum = gstin[14];
  const expectedChecksum = calculateGSTINChecksum(gstin);

  const checksumValid = expectedChecksum === actualChecksum;

  return {
    isValid: checksumValid,
    formatValid: true,
    checksumValid,
    stateCode,
    stateName: stateMatch.name,
    pan,
    expectedChecksum: expectedChecksum || undefined,
    actualChecksum,
    error: checksumValid ? undefined : `Checksum mismatch (expected '${expectedChecksum}', found '${actualChecksum}')`,
  };
}

/**
 * Validates 10-character Indian PAN format (5 uppercase letters, 4 digits, 1 uppercase letter)
 */
export function validatePAN(rawPan: string): { isValid: boolean; error?: string } {
  if (!rawPan) return { isValid: false, error: 'PAN is required' };
  const pan = rawPan.trim().toUpperCase();
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!panRegex.test(pan)) {
    return { isValid: false, error: 'PAN must be 10 alphanumeric characters (e.g. AABCC1234F)' };
  }
  return { isValid: true };
}
