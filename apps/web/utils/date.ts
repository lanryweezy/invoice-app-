/**
 * Returns the current date as an ISO date string (YYYY-MM-DD).
 */
export function getTodayISODate(): string {
  return new Date().toISOString().split('T')[0];
}
