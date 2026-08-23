Title: "🔍 Lens: State Regression — CRITICAL — FeatureGate.tsx missing focus rings"

## SCAN COVERAGE
What was scanned this session:
- Components reviewed: `apps/web/components/FeatureGate.tsx`
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
Component: apps/web/components/FeatureGate.tsx (Buttons)

What changed:
Focus-visible rings are completely missing from the interactive elements (the "Unlock [Feature]" and "Maybe later" buttons) in the `FeatureGate` component. Keyboard users tabbing through this new interface have no visual indicator of which button is focused.

Baseline:
Standard buttons across the application use standard Tailwind utility classes to provide a clear focus indicator, typically something like `focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2`.

Current state:
The buttons in `FeatureGate.tsx` are missing any `focus-visible` classes. They rely solely on standard hover/active states (`hover:bg-slate-800`, `active:scale-[0.98]`). Confirmed by code inspection of lines 136-150 in `FeatureGate.tsx`.

Reproduction steps:
1. Trigger the `FeatureGate` modal/view in the application.
2. Tab through the interface using the keyboard.
3. Observe: Neither the "Unlock [Feature]" button nor the "Maybe later" button show a focus ring when active.

Root cause (if identified):
The `FeatureGate.tsx` component was recently introduced and built using inline arbitrary styles instead of relying on a standard `<Button>` component or global defaults. The developer likely tested with a mouse (verifying hover/active states) but omitted the standard `focus-visible:` utilities needed for keyboard accessibility.

Fix required:
Add the missing `focus-visible` classes to both buttons in `apps/web/components/FeatureGate.tsx`:
For the "Unlock [Feature]" button (line 138): add `focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2`.
For the "Maybe later" button (line 145): add `focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2`.

## RECOMMENDED NEXT SESSION FOCUS
Audit other recently added components (e.g., `PremiumGate.tsx`, `PricingModal.tsx`) for missing `focus-visible` states, as the ad-hoc inline styling pattern might have been replicated there.

## INFRASTRUCTURE RECOMMENDATION
Implement Playwright snapshot testing across minimum viable viewports (375px, 768px, 1280px) and explicitly configure tests to trigger interactive states via `page.keyboard.press('Tab')` before capturing snapshots.
