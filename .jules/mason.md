## 2024-07-19 - Extracted duplicated Intl.NumberFormat to shared utility
**Learning:** `Intl.NumberFormat` instantiation has a minor (~0.6ms) overhead and was duplicated across 8 components, sometimes correctly memoized but mostly not.
**Action:** Always extract stateless formatting utilities to a single source of truth (`apps/web/utils/formatters.ts`) to ensure performance optimization without cluttering individual components.
