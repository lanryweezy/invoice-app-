🔍 **Pressure:**
The `list` command had a growing `switch (options.sort)` block that needed modification every time a new sort field (e.g., client name, due date) was added. This violates the Open-Closed principle, forcing core code changes for a simple variation in behavior.

💡 **Extension point:**
Extracted the sort logic into a `SortStrategy` pattern. Added a registry `sortStrategies` and a `registerSortStrategy` method.

🔒 **Additive:**
The original implementation was perfectly preserved. The three existing sort mechanisms (amount, status, date) were extracted and registered. Calling code requires absolutely zero changes.

📋 **Contract:**
Implementors provide a comparator function taking two `Invoice` objects and returning a number (-1, 0, 1) indicating their sort order. The core handles defaulting to the 'date' strategy if the requested strategy is not found.

✅ **Verification:**
You can add a new strategy like this without modifying core list.ts:
```typescript
registerSortStrategy('client', (a: Invoice, b: Invoice) => {
  return a.client.name.localeCompare(b.client.name);
});
```
