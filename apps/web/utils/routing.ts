export function getDecodedPathname(path?: string): string {
  const target = path !== undefined ? path : window.location.pathname;
  try {
    return decodeURIComponent(target);
  } catch (e) {
    return target; // Fallback if malformed URI
  }
}
