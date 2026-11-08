export const COOKTALE_ACCOUNT_ID = '34b70b70-72ac-4598-a009-4dab2c42dba9';

export function addVerifiedBadge<T>(input: T): T {
  if (Array.isArray(input)) return input.map(addVerifiedBadge) as T;
  if (!input || typeof input !== 'object' || input instanceof Date) return input;
  const record = input as Record<string, unknown>;
  const output = Object.fromEntries(Object.entries(record).map(([key, value]) => [key, addVerifiedBadge(value)]));
  if (typeof record.id === 'string' && 'username' in record && typeof record.isPro === 'boolean') {
    output.isVerifiedBadge = record.isPro || record.id === COOKTALE_ACCOUNT_ID;
  }
  return output as T;
}
