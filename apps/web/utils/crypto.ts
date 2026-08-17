export function generateSecureId(length: number = 6): string {
  const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);

  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset[array[i] % charset.length];
  }

  return result;
}
