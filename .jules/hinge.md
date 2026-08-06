## 2026-08-06 - Shared EmailTemplateStrategy Registry
**Learning:** Found a Two-Case Signal where the CLI `batch` command had a hardcoded switch statement for building email bodies, while the `send` command had a full Strategy registry. Consolidating these ensures that adding a new template format to the system only needs to happen in one shared registry, without touching the core logic of either command.
**Action:** Extract overlapping extension patterns into a shared utility file before implementing them a second time.
