## 2026-08-12 — State Regression: FeatureGate.tsx missing focus rings
**Regression:** Focus-visible rings completely missing from interactive buttons ("Unlock Feature" and "Maybe later") in the FeatureGate component.
**Root cause:** Standard tailwind utility classes for accessibility (`focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2`) were omitted during component implementation.
**Detection gap:** The application completely lacks automated visual regression testing (e.g. Playwright snapshots). Playwright is installed but only configured for functional assertions.
**Prevention:** Implement Playwright snapshot testing across minimum viable viewports (375px, 768px, 1280px) and explicitly test interactive states via programmatic focus and hover steps before snapshotting.
**Cascade risk:** Any new component built without a strict design system review is at risk of omitting critical interactive states, as there's no automated check to enforce them.
