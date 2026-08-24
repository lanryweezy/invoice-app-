import { trackEvent } from './analytics';
import { getErrorMessage } from './error';

export function getDecodedPathname(path: string = window.location.pathname): string {
  try {
    return decodeURIComponent(path);
  } catch (e) {
    console.error('Failed to decode URI component', { event: 'routing.decode.failed', path, error: getErrorMessage(e) });
    try { trackEvent('routing_decode_failed', { path, error: getErrorMessage(e) }); } catch {}
    return path; // Fallback if malformed URI
  }
}
