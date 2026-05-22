## 2026-05-22 - Focus-visible pseudo-class triggering in testing
**Learning:** The `focus-visible` utility classes for keyboard accessibility cannot be reliably triggered for screenshots purely by calling `element.focus()` in Playwright headless chromium, as it doesn't simulate true keyboard navigation.
**Action:** Use `page.keyboard.press('Tab')` instead of or in addition to `.focus()` when attempting to verify focus ring visibility via automated screenshots.
