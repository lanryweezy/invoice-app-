## 2026-05-22 - Focus-visible pseudo-class triggering in testing
**Learning:** The `focus-visible` utility classes for keyboard accessibility cannot be reliably triggered for screenshots purely by calling `element.focus()` in Playwright headless chromium, as it doesn't simulate true keyboard navigation.
**Action:** Use `page.keyboard.press('Tab')` instead of or in addition to `.focus()` when attempting to verify focus ring visibility via automated screenshots.
## 2024-05-24 - Do not use aria-label on buttons with visible text
**Learning:** Adding `aria-label` attributes to buttons that already contain visible text (e.g., `<button aria-label="Download receipt as PDF">Download PDF</button>`) violates WCAG 2.5.3 (Label in Name) when the label differs from the visible text. This breaks voice navigation for users relying on what they see.
**Action:** When adding context to elements with visible text, use visually hidden text spans (`sr-only` class) instead of overwriting the accessible name via `aria-label`, or ensure the `aria-label` exactly matches and starts with the visible text. Reserve `aria-label` additions primarily for icon-only buttons.

## 2024-05-24 - Dynamic Scaling for Document Previews
**Learning:** Hardcoding responsive scaling utility classes (e.g. `scale-[0.6] sm:scale-[0.7]`) on a fixed-dimension document like an A4 invoice creates arbitrary breakpoints that fail on different viewports, cause blurry rendering, and break layout flow in mobile previews.
**Action:** For document previews, strictly maintain the document's true physical dimensions (e.g. `210mm` width). Handle responsiveness by wrapping it in a viewport container that dynamically calculates the necessary scale (`containerWidth / trueWidth`) via a `useEffect` hook, and applies that computed `transform: scale()`, `width`, and `height` to the wrapper, establishing a clean separation between the document layout and the viewport adapter.
