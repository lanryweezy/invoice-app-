## 2024-03-24 - Audit Trail Tests Added
**Learning:** Testing logic involving `localforage` mock behavior inside vitest is robust and supports testing higher-order behaviors like formatting, mapping, and escaping strings correctly as long as we properly stub the `getItem` and `setItem` calls beforehand.
**Action:** When working on data-storage interacting services in the web layer, always use Vitest's `vi.mock` capabilities to bypass real IndexedDB dependencies so edge cases (such as gracefully handling missing `previousValues` properties or empty storage limits) can be safely tested locally.
