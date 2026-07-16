# Jules Task: Refactor & Clean (Sunday)

Clean up InvoiceApp codebase without adding features.

## Files to Refactor
1. `App.tsx` — extract hooks, reduce file size
2. `components/` — remove dead code, consolidate duplicates
3. `utils/` — clean unused exports
4. `services/` — consolidate duplicate logic

## Refactoring Tasks

### App.tsx Decomposition
Current App.tsx is likely 1000+ lines. Extract:

1. `hooks/usePayments.ts` — all Paystack/payment logic
2. `hooks/useInvoices.ts` — invoice CRUD operations
3. `hooks/useClients.ts` — client management
4. `hooks/useEmail.ts` — email sending logic
5. `hooks/useProGate.ts` — Pro subscription checks

### Dead Code Removal
- Remove unused imports
- Remove commented-out code
- Remove unused variables (prefix with _ or delete)
- Remove unused CSS classes
- Remove unused dependencies from package.json

### Duplicate Logic Consolidation
- Find duplicate date formatting → use single utility
- Find duplicate currency formatting → use single utility
- Find duplicate validation → create shared validators
- Find duplicate Firestore operations → create shared service

### TypeScript Strictness
- Remove all `any` types
- Add proper return types to all functions
- Fix all TypeScript warnings
- Enable strict mode if not already

### File Organization
- Move test files next to source files (Component.test.tsx next to Component.tsx)
- Ensure consistent naming (camelCase for files, PascalCase for components)
- Remove empty directories

## Rules
- Do NOT add new features
- Do NOT change functionality
- Do NOT modify CSS/styling
- Only refactor code structure
- Run `npx tsc --noEmit` to verify no type errors
- Run existing tests to verify nothing broke
