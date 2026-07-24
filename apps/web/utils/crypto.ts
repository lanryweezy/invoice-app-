export function generateSecureId(length: number = 6): string {
  // Using randomUUID for high entropy and cleaner implementation
  // Repeat UUID to generate longer strings if requested length > 32
  const uuid = crypto.randomUUID().replace(/-/g, '');
  return uuid.repeat(Math.ceil(length / 32)).substring(0, length).toUpperCase();
}
