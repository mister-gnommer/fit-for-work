const NIP_WEIGHTS = [6, 5, 7, 2, 3, 4, 5, 6, 7];

/**
 * Removes the spaces and hyphens people type into a NIP (e.g. `521-000-11-26`).
 * @param value NIP as entered
 * @returns the NIP without separators
 */
export function normalizeNip(value: string): string {
  return value.replace(/[\s-]/g, "");
}

/**
 * Checks a normalized NIP: 10 digits whose weighted checksum (mod 11) equals the last digit.
 * A remainder of 10 can never match a digit, so such numbers are invalid.
 */
export function isValidNip(nip: string): boolean {
  if (!/^\d{10}$/.test(nip)) {
    return false;
  }
  const digits = [...nip].map(Number);
  const sum = NIP_WEIGHTS.reduce((total, weight, index) => total + weight * digits[index], 0);
  return sum % 11 === digits[9];
}

/** Checks the Polish postal code format `NN-NNN`. */
export function isValidPostalCode(value: string): boolean {
  return /^\d{2}-\d{3}$/.test(value);
}

const PESEL_WEIGHTS = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];

/** Checks a PESEL: 11 digits whose last digit matches the weighted checksum. The embedded date isn't checked. */
export function isValidPesel(pesel: string): boolean {
  if (!/^\d{11}$/.test(pesel)) {
    return false;
  }
  const digits = [...pesel].map(Number);
  const sum = PESEL_WEIGHTS.reduce((total, weight, index) => total + weight * digits[index], 0);
  return (10 - (sum % 10)) % 10 === digits[10];
}
