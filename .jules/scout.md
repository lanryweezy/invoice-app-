## 2024-05-20 - Vitest JSDOM Global Mocking
**Learning:** In Vitest environments like apps/web, window.Notification behaves as both a constructor and an object with static methods. Mocking by directly deleting/assigning window.Notification causes failures because window might not be fully defined or accessible.
**Action:** Always use vi.stubGlobal('Notification', mock) where mock is a vi.fn() casted as any, explicitly assigning static methods like requestPermission as separate mock functions. Restore using vi.unstubAllGlobals() in afterEach.
