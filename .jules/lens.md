## 2026-08-12 — State Regression: FeatureGate.tsx missing focus rings
**Regression:** Focus-visible rings completely missing from interactive buttons ("Unlock Feature" and "Maybe later") in the FeatureGate component.
**Root cause:** Standard tailwind utility classes for accessibility (`focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2`) were omitted during component implementation.
**Detection gap:** The application completely lacks automated visual regression testing (e.g. Playwright snapshots). Playwright is installed but only configured for functional assertions.
**Prevention:** Implement Playwright snapshot testing across minimum viable viewports (375px, 768px, 1280px) and explicitly test interactive states via programmatic focus and hover steps before snapshotting.
**Cascade risk:** Any new component built without a strict design system review is at risk of omitting critical interactive states, as there's no automated check to enforce them.
## 2026-08-14 — State Regression: FeatureGate.tsx missing focus rings
**Regression:** Focus-visible rings completely missing from interactive buttons ("Unlock Feature" and "Maybe later") in the FeatureGate component.
**Root cause:** Standard tailwind utility classes for accessibility (`focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2`) were omitted during component implementation.
**Detection gap:** The application lacks comprehensive automated visual regression testing configured for interactive states (focus/hover). Playwright is installed but primarily used for functional flows.
**Prevention:** Implement Playwright snapshot testing across minimum viable viewports (375px, 768px, 1280px) and explicitly trigger interactive states via `page.keyboard.press('Tab')` (as opposed to just `.focus()`) before snapshotting.
**Cascade risk:** Any new component built without a strict design system review is at risk of omitting critical interactive states, as there is no automated check to enforce them.
## 2026-08-16 — State Regression: FeatureGate.tsx missing focus rings
**Regression:** Focus-visible rings are completely missing from the primary interactive buttons ("Unlock Feature" and "Maybe later"). Keyboard users tabbing through the interface see no visual indicator of which button is currently focused.
**Root cause:** The standard Tailwind utility classes for accessibility (`focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2`) were omitted from the button elements during the implementation of the `FeatureGate` component in `apps/web/components/FeatureGate.tsx`.
**Detection gap:** Playwright is installed but only configured for functional assertions, not visual regression snapshots that check interactive states.
**Prevention:** Implement Playwright snapshot testing across minimum viable viewports (375px, 768px, 1280px) and explicitly trigger interactive states via `page.keyboard.press('Tab')` before snapshotting.
**Cascade risk:** Any new component built without a strict design system review is at risk of omitting critical interactive states, as there is no automated check to enforce them.
## 2026-08-17 — State Regression: FeatureGate.tsx buttons missing focus rings
**Regression:** Focus-visible rings are missing from the primary and secondary action buttons in the new FeatureGate component, making them inaccessible for keyboard navigation.
**Root cause:** A new component (`FeatureGate.tsx`) was introduced in a recent refactor without carrying over the standard `focus-visible` token classes (e.g. `focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2`) used throughout the rest of the application.
**Detection gap:** The component was visually reviewed using a mouse, which triggered standard `hover:` states, but keyboard navigation (tabbing) was not tested before the component was merged. Automated tests lack visual interaction testing.
**Prevention:** Interactive elements should be audited via keyboard navigation during PR review, and `focus-visible` utilities should be enforced via a linting rule or a centralized button component to avoid missing them in isolated ad-hoc implementations.
**Cascade risk:** Any future components that recreate button styles inline rather than using a standardized `Button` component run the risk of dropping crucial accessibility state classes.
