Title: "🚨 Slop Audit: InvoiceApp — apps/web/components — [0 BLOCK, 3 WARN, 0 NOTE]"

━━━━━━━━━━━━━━━━━━━━━━━━
AUDIT SCOPE
━━━━━━━━━━━━━━━━━━━━━━━━
App type:       SaaS
Framework:      React
Styling:        Tailwind CSS
Spacing grid:   4px
Token system:   partial (tailwind.config.js exists, but inline violations found)
Components audited:   apps/web/components/* (FeatureGate.tsx, InvoicePreview.tsx)
Components skipped:   Third-party integrations not controlled by the UI system

━━━━━━━━━━━━━━━━━━━━━━━━
SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━
| Severity | Count | Categories                        |
|----------|-------|-----------------------------------|
| 🔴 BLOCK | 0     |                                   |
| 🟡 WARN  | 3     | Token(3)                          |
| 🔵 NOTE  | 0     |                                   |

━━━━━━━━━━━━━━━━━━━━━━━━
BLOCK FINDINGS
━━━━━━━━━━━━━━━━━━━━━━━━
[None found in this focused Token audit]

━━━━━━━━━━━━━━━━━━━━━━━━
WARN FINDINGS
━━━━━━━━━━━━━━━━━━━━━━━━
┌─────────────────────────────────────────────────────┐
│ [WARN 🟡] Component: FeatureGate.tsx                │
│ Category: Category 2 — Token Violations              │
│                                                      │
│ Finding:                                             │
│ The FeatureGate component uses an arbitrary rgba box-shadow │
│ that does not exist in the design token system or Tailwind config. │
│ This creates an inconsistent elevation and acts as a slop signature. │
│                                                      │
│ Evidence:                                            │
│ `className="relative z-10 w-full max-w-sm bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-[0_0_40px_rgba(0,0,0,0.5)]"` │
│                                                      │
│ Fix required:                                        │
│ Replace `shadow-[0_0_40px_rgba(0,0,0,0.5)]` with the application's standard tailwind class `shadow-2xl` or define the token. │
│                                                      │
│ Research basis:                                      │
│ "Arbitrary hex values not defined in any token file" and "shadow recipe invented inline" are primary AI slop markers. │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ [WARN 🟡] Component: FeatureGate.tsx                │
│ Category: Category 2 — Token Violations              │
│                                                      │
│ Finding:                                             │
│ The FeatureGate component uses another arbitrary rgba box-shadow │
│ not mapped to any known token, contributing to inconsistent elevations. │
│                                                      │
│ Evidence:                                            │
│ `className="relative z-10 w-full max-w-sm aspect-square bg-white/5 backdrop-blur-xl border border-white/10 rounded-full p-8 shadow-[0_0_50px_rgba(0,0,0,0.3)] flex items-center justify-center group"` │
│                                                      │
│ Fix required:                                        │
│ Replace `shadow-[0_0_50px_rgba(0,0,0,0.3)]` with standard Tailwind utility like `shadow-2xl` or `shadow-xl`. │
│                                                      │
│ Research basis:                                      │
│ "Arbitrary hex values not defined in any token file" and "shadow recipe invented inline" are primary AI slop markers. │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ [WARN 🟡] Component: InvoicePreview.tsx             │
│ Category: Category 2 — Token Violations              │
│                                                      │
│ Finding:                                             │
│ The InvoicePreview component uses an arbitrary hardcoded rgba shadow string │
│ rather than a variable from the Tailwind token system. │
│                                                      │
│ Evidence:                                            │
│ `totalBox: 'border border-slate-800 p-4 mt-4 bg-slate-50 shadow-[4px_4px_0px_0px_rgba(30,41,59,1)]'` │
│                                                      │
│ Fix required:                                        │
│ Define this specific sharp shadow in `tailwind.config.js` (e.g. `shadow-sharp`) and use `shadow-sharp` or use the standard `shadow-md`. │
│                                                      │
│ Research basis:                                      │
│ "Arbitrary hex values not defined in any token file" and "shadow recipe invented inline" are primary AI slop markers. │
└─────────────────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━
NOTE FINDINGS
━━━━━━━━━━━━━━━━━━━━━━━━
[None found in this focused Token audit]

━━━━━━━━━━━━━━━━━━━━━━━━
DESIGN SYSTEM STATUS
━━━━━━━━━━━━━━━━━━━━━━━━
Token system:      partial
Spacing grid:      enforced (4px scale primarily)
Shadow system:     >4 recipes found (arbitrary rgba values being created inline)
Empty state system:ad-hoc
Interactive states:inconsistent

━━━━━━━━━━━━━━━━━━━━━━━━
EXEMPTIONS
━━━━━━━━━━━━━━━━━━━━━━━━
None.

━━━━━━━━━━━━━━━━━━━━━━━━
ROUTING
━━━━━━━━━━━━━━━━━━━━━━━━
Token violations          → Token agent (or developer)

━━━━━━━━━━━━━━━━━━━━━━━━
NEXT AUDIT
━━━━━━━━━━━━━━━━━━━━━━━━
Category 1 (Interactive States) for the full apps/web/components directory. Many buttons lack focus-visible rings.
