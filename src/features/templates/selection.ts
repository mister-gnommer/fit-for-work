export type FactorSelection = { riskFactorId: string; exposureLevel: string | null };

/**
 * Reads the factors checked on the template form. Each factor has a checkbox `factor-<id>` and an
 * exposure level input `exposure-<id>`; levels of unchecked factors are ignored.
 * @param formData submitted template form
 * @returns one entry per checked factor, with a trimmed exposure level or null
 */
export function readFactorSelection(formData: FormData): FactorSelection[] {
  const selection: FactorSelection[] = [];
  for (const key of new Set(formData.keys())) {
    if (!key.startsWith("factor-")) {
      continue;
    }
    const riskFactorId = key.slice("factor-".length);
    const exposureLevel = String(formData.get(`exposure-${riskFactorId}`) ?? "").trim();
    selection.push({ riskFactorId, exposureLevel: exposureLevel || null });
  }
  return selection;
}
