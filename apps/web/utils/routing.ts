export function getDecodedPathname(path?: string): string {
  const pathToDecode = path ?? window.location.pathname;
  try {
    return decodeURIComponent(pathToDecode);
  } catch (e) {
    return pathToDecode; // Fallback if malformed URI
  }
}
