/**
 * Safely decodes the current window pathname.
 *
 * Uses `decodeURIComponent` to parse the path, but gracefully falls back
 * to the raw pathname if the URI is malformed to prevent routing crashes.
 */
export function getDecodedPathname(): string {
  try {
    return decodeURIComponent(window.location.pathname);
  } catch (e) {
    return window.location.pathname; // Fallback if malformed URI
  }
}
