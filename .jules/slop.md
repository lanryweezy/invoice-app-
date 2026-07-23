## 2025-05-24 — InvoiceApp: Category 2 (Token Violations): Arbitrary Inline Box Shadows
**Pattern:** Creating inline box-shadow utility classes in Tailwind using arbitrary rgba arrays (e.g. `shadow-[0_0_40px_rgba(0,0,0,0.5)]`). Found in `FeatureGate.tsx` and `InvoicePreview.tsx`.
**Root cause:** Developers likely copying complex shadows from a design tool without standardizing them in the `tailwind.config.js` or using pre-defined tokens.
**Audit gap:** None, standard grep pattern `shadow-\[` or `rgba` catches these.
**Resolution:** Route to Token agent to standardize these specific shadow drops in `tailwind.config.js`.
