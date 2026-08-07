## 2024-05-20 - Vitest JSDOM Global Mocking
**Learning:** In Vitest environments like apps/web, window.Notification behaves as both a constructor and an object with static methods. Mocking by directly deleting/assigning window.Notification causes failures because window might not be fully defined or accessible.
**Action:** Always use vi.stubGlobal('Notification', mock) where mock is a vi.fn() casted as any, explicitly assigning static methods like requestPermission as separate mock functions. Restore using vi.unstubAllGlobals() in afterEach.
## 2024-05-20 - Coverage Artifact Pollution
**Learning:** Running `npx vitest run --coverage` generates a `coverage/` directory containing large HTML and JS artifacts. If `.gitignore` doesn't strictly exclude it, these files will end up staged for commit, polluting the repository and violating version control hygiene.
**Action:** Always check `git status` after generating test coverage. If a `coverage/` directory is present and staged, run `git restore --staged <dir>` and `rm -rf <dir>` before requesting code review or submitting the patch.
