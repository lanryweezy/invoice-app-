## 2024-08-06 - Test file creation

**Learning:** When using `as any` in mock data inside vitest, while it circumvents TypeScript's stringent checks on big interfaces, it is completely acceptable within tests here because it safely mimics complex objects (like invoices) without needing full instantiations, a common strategy applied across the repo.
**Action:** When stubbing massive objects such as `Invoice` or `Client`, rely on `as any` or `as unknown as Type` for partial mocks instead of exhaustively creating large fixtures that clutter tests, so long as the fields vital to the test logic are correctly initialized.
