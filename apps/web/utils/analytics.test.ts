import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { trackEvent, collectSessionDetails } from './analytics';

describe('analytics', () => {
    beforeEach(() => {
        // Clear mocks
        vi.clearAllMocks();

        // Stub globals
        vi.stubGlobal('innerWidth', 1024);
        vi.stubGlobal('innerHeight', 768);
        vi.stubGlobal('devicePixelRatio', 2);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe('trackEvent', () => {
        it('should call window.gtag if it exists', () => {
            const gtagMock = vi.fn();
            vi.stubGlobal('gtag', gtagMock);

            trackEvent('test_event', { foo: 'bar' });

            expect(gtagMock).toHaveBeenCalledWith('event', 'test_event', { foo: 'bar' });
        });

        it('should not throw if window.gtag does not exist', () => {
            vi.stubGlobal('gtag', undefined);

            expect(() => {
                trackEvent('test_event', { foo: 'bar' });
            }).not.toThrow();
        });
    });
});

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
        let originalOntouchstart: any;

        beforeEach(() => {
            Object.defineProperty(window, 'location', {
                value: { search: '?utm_source=google&utm_medium=cpc&utm_campaign=summer_sale' },
                writable: true
            });
            Object.defineProperty(document, 'referrer', {
                value: 'https://example.com',
                configurable: true
            });

            vi.stubGlobal('navigator', {
                language: 'en-US',
                userAgent: 'Mozilla/5.0 (Test)',
                platform: 'Win32',
                hardwareConcurrency: 4,
                connection: {
                    effectiveType: '4g',
                    saveData: true
                },
                maxTouchPoints: 0
            });

            // Save original and remove to ensure reliable "is_touch: false" test
            if ('ontouchstart' in window) {
                originalOntouchstart = (window as any).ontouchstart;
                delete (window as any).ontouchstart;
            }
        });

        afterEach(() => {
            if (originalOntouchstart !== undefined) {
                (window as any).ontouchstart = originalOntouchstart;
            }
        });

        it('should collect session details correctly for desktop', () => {
            vi.stubGlobal('innerWidth', 1024);
            vi.stubGlobal('innerHeight', 768);
            vi.stubGlobal('devicePixelRatio', 2);

            const details = collectSessionDetails();

            expect(details).toEqual({
                referrer: 'https://example.com',
                utm_source: 'google',
                utm_medium: 'cpc',
                utm_campaign: 'summer_sale',
                screen_width: 1024,
                screen_height: 768,
                pixel_ratio: 2,
                is_touch: false, // assuming 'ontouchstart' is not in window
                device_type: 'desktop',
                orientation: 'landscape',
                language: 'en-US',
                userAgent: 'Mozilla/5.0 (Test)',
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                connection_type: '4g',
                connection_save_data: true,
                platform: 'Win32',
                hardware_concurrency: 4
            });
        });

        it('should collect session details correctly for mobile', () => {
            vi.stubGlobal('innerWidth', 375);
            vi.stubGlobal('innerHeight', 667);

            // Stub touch for mobile
            (window as any).ontouchstart = null;

            const details = collectSessionDetails();

            expect(details.device_type).toBe('mobile');
            expect(details.is_touch).toBe(true);
            expect(details.orientation).toBe('portrait');

            delete (window as any).ontouchstart;
        });

        it('should collect session details correctly for tablet', () => {
            vi.stubGlobal('innerWidth', 768);
            vi.stubGlobal('innerHeight', 1024);

            const details = collectSessionDetails();
            expect(details.device_type).toBe('tablet');
        });
    });

    describe('collectSessionDetails - extended', () => {
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

        it('should handle missing navigator connection', () => {
             vi.stubGlobal('navigator', {
                language: 'en-US',
                userAgent: 'Mozilla/5.0 (Test)',
                platform: 'Win32',
                hardwareConcurrency: 4,
                maxTouchPoints: 0
                // no connection
            });
            const details = collectSessionDetails();
            expect(details.connection_type).toBe('unknown');
            expect(details.connection_save_data).toBe(false);
        });

        it('should default referrer to direct if document.referrer is empty', () => {
            Object.defineProperty(document, 'referrer', {
                value: '',
                configurable: true
            });
            const details = collectSessionDetails();
            expect(details.referrer).toBe('direct');
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
