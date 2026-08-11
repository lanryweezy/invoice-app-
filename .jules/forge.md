## 2024-08-06 - Test file creation

**Learning:** When using `as any` in mock data inside vitest, while it circumvents TypeScript's stringent checks on big interfaces, it is completely acceptable within tests here because it safely mimics complex objects (like invoices) without needing full instantiations, a common strategy applied across the repo.
**Action:** When stubbing massive objects such as `Invoice` or `Client`, rely on `as any` or `as unknown as Type` for partial mocks instead of exhaustively creating large fixtures that clutter tests, so long as the fields vital to the test logic are correctly initialized.
## 2024-08-10 - Mocking Storage APIs

**Learning:** When spying on global browser APIs like `Storage.prototype.getItem` and `Storage.prototype.setItem`, use `mockClear()` in `beforeEach` to reset call counts and `mockRestore()` in `afterAll` to clean up the spies entirely.
**Action:** When testing modules that interact with `localStorage` or `sessionStorage`, ensure global spies are properly restored to prevent cross-test pollution. Use `vi.spyOn(Storage.prototype, 'getItem')` and restore it afterward.

## 2024-08-11 - Testing Commander CLI with Inquirer
**Learning:** When testing CLI commands that use inquirer for interactive prompts alongside commander, use vi.mock to mock inquirer and return the expected resolved values to simulate user input without halting the test.
**Action:** For all future tests involving interactive CLI flows, mock inquirer.prompt and use .mockResolvedValueOnce() to provide sequence-specific answers.
