import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { trackEvent, collectSessionDetails } from './analytics';

describe('analytics.ts', () => {
    describe('trackEvent', () => {
        let originalGtag: any;

        beforeEach(() => {
            originalGtag = (window as any).gtag;
        });

        afterEach(() => {
            if (originalGtag) {
                (window as any).gtag = originalGtag;
            } else {
                delete (window as any).gtag;
            }
        });

        it('should call window.gtag when defined', () => {
            const mockGtag = vi.fn();
            (window as any).gtag = mockGtag;

            trackEvent('test_event', { param1: 'value1' });

            expect(mockGtag).toHaveBeenCalledWith('event', 'test_event', { param1: 'value1' });
        });

        it('should not throw when window.gtag is undefined', () => {
            delete (window as any).gtag;

            expect(() => trackEvent('test_event')).not.toThrow();
        });
    });

    describe('collectSessionDetails', () => {
        beforeEach(() => {
            vi.stubGlobal('innerWidth', 1024);
            vi.stubGlobal('innerHeight', 768);
            vi.stubGlobal('devicePixelRatio', 2);

            vi.stubGlobal('location', { search: '?utm_source=test_source&utm_medium=test_medium&utm_campaign=test_campaign' });

            Object.defineProperty(navigator, 'language', { value: 'en-US', configurable: true });
            Object.defineProperty(navigator, 'userAgent', { value: 'test-agent', configurable: true });
            Object.defineProperty(navigator, 'platform', { value: 'test-platform', configurable: true });
            Object.defineProperty(navigator, 'hardwareConcurrency', { value: 4, configurable: true });
            Object.defineProperty(navigator, 'maxTouchPoints', { value: 0, configurable: true });

            (navigator as any).connection = {
                effectiveType: '4g',
                saveData: false
            };

            Object.defineProperty(document, 'referrer', { value: 'https://example.com', configurable: true });
        });

        afterEach(() => {
            vi.unstubAllGlobals();
            vi.restoreAllMocks();
        });

        it('should collect session details correctly for desktop', () => {
            vi.stubGlobal('innerWidth', 1200);
            vi.stubGlobal('innerHeight', 800);

            const details = collectSessionDetails();

            expect(details).toEqual(expect.objectContaining({
                referrer: 'https://example.com',
                utm_source: 'test_source',
                utm_medium: 'test_medium',
                utm_campaign: 'test_campaign',
                screen_width: 1200,
                screen_height: 800,
                pixel_ratio: 2,
                device_type: 'desktop',
                orientation: 'landscape',
                language: 'en-US',
                userAgent: 'test-agent',
                connection_type: '4g',
                connection_save_data: false,
                platform: 'test-platform',
                hardware_concurrency: 4
            }));

            expect(details.timeZone).toBeDefined();
            expect(details.is_touch).toBeDefined();
        });

        it('should detect mobile device type', () => {
            vi.stubGlobal('innerWidth', 500);
            vi.stubGlobal('innerHeight', 800);

            const details = collectSessionDetails();
            expect(details.device_type).toBe('mobile');
            expect(details.orientation).toBe('portrait');
        });

        it('should detect tablet device type', () => {
            vi.stubGlobal('innerWidth', 800);
            vi.stubGlobal('innerHeight', 1000);

            const details = collectSessionDetails();
            expect(details.device_type).toBe('tablet');
            expect(details.orientation).toBe('portrait');
        });

        it('should handle undefined connection, search params, and referrer gracefully', () => {
            delete (navigator as any).connection;
            vi.stubGlobal('location', { search: '' });
            Object.defineProperty(document, 'referrer', { value: '', configurable: true });

            const details = collectSessionDetails();

            expect(details.connection_type).toBe('unknown');
            expect(details.connection_save_data).toBe(false);
            expect(details.utm_source).toBeUndefined();
            expect(details.referrer).toBe('direct');
        });
    });
});
