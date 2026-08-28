Title: "🔍 Lens: State Regression — CRITICAL — PremiumGate.tsx & PricingModal.tsx missing focus rings"

## SCAN COVERAGE
What was scanned this session:
- Components reviewed: `apps/web/components/PremiumGate.tsx`, `apps/web/components/PricingModal.tsx`
- Viewports tested: Code review (Manual verification)
- Browsers tested: N/A (Code review)
- States tested: focus
- Infrastructure available: Playwright (configured for E2E, not visual snapshots)

## VISUAL TESTING INFRASTRUCTURE STATUS
- Exists: yes — Playwright
- Baseline age: N/A (no visual snapshots configured)
- CI integration: yes (functional only)
- Gap identified: Playwright is present but visual regression testing using snapshots (especially for interactive states like focus and hover) is entirely missing. This allows accessibility regressions to slip through.

## PRIMARY FINDING
[CRITICAL 🔴] Type: State Regression
Component: apps/web/components/PremiumGate.tsx & apps/web/components/PricingModal.tsx (Buttons)

What changed:
Focus-visible rings are completely missing from some interactive elements (the secondary CTA in PremiumGate and the Free Account/Maybe Later buttons in PricingModal). Keyboard users tabbing through this new interface have no visual indicator of which button is focused.

Baseline:
Standard buttons across the application use standard Tailwind utility classes to provide a clear focus indicator, typically something like `focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2`.

Current state:
The secondary buttons in `PremiumGate.tsx` and `PricingModal.tsx` are missing any `focus-visible` classes. They rely solely on standard hover states.
- In `PremiumGate.tsx`, the primary CTA has `focus-visible` classes, but the secondary CTA (lines 88-95) does not.
- In `PricingModal.tsx`, the `onLogin` button (line 141) and `onClose` button (line 205) are missing `focus-visible` classes.

Reproduction steps:
1. Trigger the `PremiumGate` or `PricingModal` modal/view in the application.
2. Tab through the interface using the keyboard.
3. Observe: The secondary buttons show no focus ring when active.

Root cause (if identified):
These components were recently introduced and built using inline arbitrary styles instead of relying on a standard `<Button>` component or global defaults. While the primary CTAs received focus states in some cases, the secondary CTAs were overlooked.

Fix required:
Add the missing `focus-visible` classes to the secondary buttons in `apps/web/components/PremiumGate.tsx` and `apps/web/components/PricingModal.tsx`:
- For `PremiumGate.tsx` secondary CTA: add `focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2`.
- For `PricingModal.tsx` `onLogin` button: add `focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2`.
- For `PricingModal.tsx` `onClose` button: add `focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2`.

## RECOMMENDED NEXT SESSION FOCUS
Audit other recently added components (e.g., `FeatureGate.tsx`) for missing `focus-visible` states, as the ad-hoc inline styling pattern might have been replicated there.

## INFRASTRUCTURE RECOMMENDATION
Implement Playwright snapshot testing across minimum viable viewports (375px, 768px, 1280px) and explicitly configure tests to trigger interactive states via `page.keyboard.press('Tab')` before capturing snapshots.