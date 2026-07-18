## 2024-07-18 - Extensible String Union Types
**Learning:** When turning a closed system into a registry, converting a strict union type (`'a' | 'b'`) to just `string` degrades the developer experience by removing IDE autocomplete.
**Action:** Use the `(string & {})` pattern for type definitions (e.g., `type TemplateType = 'a' | 'b' | (string & {})`) to maintain strict autocompletion for built-in cases while allowing arbitrary strings for plugins.
