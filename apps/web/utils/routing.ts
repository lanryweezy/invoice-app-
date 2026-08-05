export function getDecodedPathname(path: string = window.location.pathname): string {
  try {
    return decodeURIComponent(path);
  } catch (e) {
    return path; // Fallback if malformed URI
  }
}
