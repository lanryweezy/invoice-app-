export function generateSecureId(length: number = 6): string {
  const array = new Uint8Array(Math.ceil(length / 2));
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('').toUpperCase().substring(0, length);
}
