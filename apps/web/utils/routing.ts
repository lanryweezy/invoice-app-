export function getDecodedPathname(): string {
  try {
    return decodeURIComponent(window.location.pathname);
  } catch (e) {
    return window.location.pathname;
  }
}
