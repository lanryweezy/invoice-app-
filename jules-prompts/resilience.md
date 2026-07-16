# Jules Task: Resilience (Tuesday)

Add error handling, retry logic, and loading states to the InvoiceApp web app.

## Files to Modify
1. `components/App.tsx` — add ErrorBoundary wrapper, offline detection
2. `components/InvoiceForm.tsx` — add loading states, validation feedback
3. `components/InvoicePreview.tsx` — add PDF generation error handling
4. `components/ClientPortalView.tsx` — add network retry, timeout handling
5. `components/PaymentModal.tsx` — add Paystack popup blocked detection

## What to Add

### ErrorBoundary Component
Create `components/ErrorBoundary.tsx`:
- Catches React render errors
- Shows friendly error message with "Try Again" button
- Logs error to console for debugging
- Wraps main App component

### Offline Detection
Add to App.tsx:
- Listen to `navigator.onLine` events
- Show banner when offline: "You're offline. Changes will sync when connected."
- Queue Firestore writes when offline, retry when online

### Loading States
For each component that fetches data:
- Show spinner while loading
- Show "No data yet" when empty
- Show error message on failure with retry button

### Network Retry
For Firestore operations:
- Retry failed writes up to 3 times with exponential backoff
- Show "Saving..." → "Saved" → "Save failed, retry?" flow

### Paystack Popup Handling
In PaymentModal:
- Detect if popup was blocked
- Show message: "Popup blocked. Please allow popups for this site."
- Offer fallback: redirect to Paystack in same tab

## Rules
- Use existing spinner component from utils/spinner if available
- Keep error messages user-friendly, not technical
- Don't break existing functionality
- Test that app still renders with ErrorBoundary
