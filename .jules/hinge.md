## 2024-07-18 - Extensible String Union Types
**Learning:** When turning a closed system into a registry, converting a strict union type (`'a' | 'b'`) to just `string` degrades the developer experience by removing IDE autocomplete.
**Action:** Use the `(string & {})` pattern for type definitions (e.g., `type TemplateType = 'a' | 'b' | (string & {})`) to maintain strict autocompletion for built-in cases while allowing arbitrary strings for plugins.

## 2024-07-19 - Audit Export Strategy

**Learning:** Hardcoded literal formats (like `format: 'csv' | 'json'`) inside core service functions (`exportAuditTrail`) block extensibility and force core modifications when a new format (e.g., PDF) is needed. Converting the literal type to a registry lookup pattern allows external modules to inject new formats without altering the core function.
**Action:** When you find a function taking a format literal and branching on it, extract those branches into an `ExportStrategy` registry. Update the function to look up the strategy by format key, maintaining existing functionality while enabling additive extensibility.
## 2025-02-28 - Preserving IDE Autocomplete when extending String Unions
**Learning:** When making a string union type (like `RecurringFrequency = 'weekly' | 'monthly'`) extensible for custom strings registered via an extension point, simply changing it to `string` destroys IDE autocomplete for the core types.
**Action:** Always use the `| (string & {})` pattern when expanding string unions for plugin registries. This allows arbitrary strings to be accepted by the compiler without collapsing the union, preserving DX (autocomplete) for the original literals.
