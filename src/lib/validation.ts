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
