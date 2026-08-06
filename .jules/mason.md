## 2026-08-06 - Extracted Date Duplication
**Learning:** Found heavily duplicated inline date generation `new Date().toISOString().split('T')[0]` scattered across components.
**Action:** Created `getTodayISODate` in a shared util to enforce dry patterns.
