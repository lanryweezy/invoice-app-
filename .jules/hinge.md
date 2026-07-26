## 2024-07-18 - Extensible String Union Types
**Learning:** When turning a closed system into a registry, converting a strict union type (`'a' | 'b'`) to just `string` degrades the developer experience by removing IDE autocomplete.
**Action:** Use the `(string & {})` pattern for type definitions (e.g., `type TemplateType = 'a' | 'b' | (string & {})`) to maintain strict autocompletion for built-in cases while allowing arbitrary strings for plugins.

## 2024-07-19 - Audit Export Strategy

**Learning:** Hardcoded literal formats (like `format: 'csv' | 'json'`) inside core service functions (`exportAuditTrail`) block extensibility and force core modifications when a new format (e.g., PDF) is needed. Converting the literal type to a registry lookup pattern allows external modules to inject new formats without altering the core function.
**Action:** When you find a function taking a format literal and branching on it, extract those branches into an `ExportStrategy` registry. Update the function to look up the strategy by format key, maintaining existing functionality while enabling additive extensibility.
## 2024-07-20 - Extract audit export logic into strategy registry
**Learning:** Hard-coded `if`/`else` structures checking for specific format strings (like 'csv' or 'json') in core functions represent latent extension pressure. Defining an explicit strategy interface and mapping registered strategies by format ID provides a flexible and type-safe extension hook without breaking existing calling patterns or requiring caller changes.
**Action:** When adding support for an arbitrary number of output formats (like exports or templates), preemptively refactor to use a registry pattern with a stable, documented strategy contract to prevent the core switch/if-chain from growing indefinitely.

## 2024-07-24 - Dynamic Regex Generation Requires Syntax Validation
**Learning:** When creating an extension point that dynamically constructs a Regular Expression (like compiling a list of keywords into capture groups), the `type` or identifier provided by the implementor must be strictly validated. If a consumer registers a category with an invalid regex capture group name (e.g., using hyphens or spaces), the dynamic `new RegExp()` instantiation will throw a `SyntaxError` at runtime and crash the application.
**Action:** Always add rigorous sanitization or validation (e.g., `/^[a-zA-Z_][a-zA-Z0-9_]*$/`) against implementor-provided keys if those keys are subsequently injected into compiled runtime constructs like regex patterns.

## 2025-02-21 - Abstracting format outputs in CLI commands
**Learning:** Hard-coded switch statements (e.g., \`switch (options.format)\`) that directly write to `console.log` for output formatting are a common extensibility bottleneck in CLI applications. A simple Registry and Strategy interface allows injecting new output modes without modifying the core command logic.
**Action:** When a CLI command branches heavily on formatting (table vs json vs csv), proactively refactor to a registry of \`OutputStrategy\` handlers that take the command's dataset as input.
