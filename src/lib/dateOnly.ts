/**
 * Helpers for working with date-only strings stored as "YYYY-MM-DD".
 *
 * We intentionally normalize to local *noon* to avoid DST/timezone edge cases
 * that can cause the rendered day to shift.
 */

export function parseDateOnly(value?: string | null): Date | null {
  if (!value) return null;
  const parts = value.split("-").map((n) => Number(n));
  if (parts.length !== 3) return null;
  const [year, month, day] = parts;
  if (!year || !month || !day) return null;

  // Local noon to avoid DST midnight weirdness.
  return new Date(year, month - 1, day, 12, 0, 0);
}

export function formatDateOnly(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
