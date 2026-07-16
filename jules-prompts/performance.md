# Jules Task: Performance (Friday)

Optimize InvoiceApp performance.

## Files to Modify
1. `components/App.tsx` — code splitting, lazy loading
2. `components/InvoicePreview.tsx` — memoize calculations
3. `components/ClientPortalView.tsx` — virtualize list
4. `vite.config.ts` — bundle optimization
5. `index.html` — preload hints

## Optimizations

### Code Splitting (App.tsx)
Lazy load heavy components:
```typescript
const ClientPortalView = React.lazy(() => import('./components/ClientPortalView'));
const InvoicePreview = React.lazy(() => import('./components/InvoicePreview'));
const PricingModal = React.lazy(() => import('./components/PricingModal'));
```
Add Suspense with loading fallback.

### Memoize Calculations
In InvoicePreview.tsx:
- Memoize subtotal/tax/total calculations with useMemo
- Memoize line item rendering with React.memo
- Avoid recalculating on every render

### Virtual Scrolling
If invoice list > 50 items:
- Use windowing/virtualization
- Only render visible rows
- Show "Showing X of Y" indicator

### Bundle Optimization
In vite.config.ts:
- Enable manual chunks for vendor code
- Split Firebase into separate chunk
- Split Paystack into separate chunk
- Enable gzip compression

### Image Optimization
- Lazy load logo images
- Use responsive srcset for logos
- Compress uploaded logos

### Caching
- Cache invoice list in localStorage
- Cache client list in localStorage
- Invalidate cache on write operations

## Measurement
Before and after, report:
- Bundle size (main chunk, vendor chunk)
- Initial load time
- Time to interactive
- Number of components lazy loaded
