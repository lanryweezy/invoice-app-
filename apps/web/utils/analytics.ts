
export const trackEvent = (eventName: string, params?: Record<string, any>) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', eventName, params);
    }
};

export const collectSessionDetails = () => {
    const nav = navigator as any;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;

    const getSearchParam = (key: string) => {
        const p = new URLSearchParams(window.location.search);
        return p.get(key) || undefined;
    };

    const width = window.innerWidth;
    let deviceType = 'desktop';
    if (width < 768) deviceType = 'mobile';
    else if (width < 1024) deviceType = 'tablet';

    return {
        // Source / Referrer / Campaigns
        referrer: document.referrer || 'direct',
        utm_source: getSearchParam('utm_source'),
        utm_medium: getSearchParam('utm_medium'),
        utm_campaign: getSearchParam('utm_campaign'),

        // Device Details
        screen_width: width,
        screen_height: window.innerHeight,
        pixel_ratio: window.devicePixelRatio,
        is_touch: 'ontouchstart' in window || nav.maxTouchPoints > 0,
        device_type: deviceType,
        orientation: width > window.innerHeight ? 'landscape' : 'portrait',

        // User Settings
        language: navigator.language,
        userAgent: navigator.userAgent,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,

        // Network Info (if supported)
        connection_type: connection ? connection.effectiveType : 'unknown',
        connection_save_data: connection ? connection.saveData : false,

        // Platform
        platform: nav.platform,
        hardware_concurrency: nav.hardwareConcurrency
    };
};
