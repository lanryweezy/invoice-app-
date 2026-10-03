## 2024-05-31 - Insecure transaction reference generation
**Vulnerability:** Predictable transaction reference format using `INV-${Date.now()}` in `generatePaymentQR`
**Learning:** `Date.now()` is completely predictable, leading to transaction enumeration or replay attacks. Memory explicitly states: "When generating transaction references for external payment gateways (e.g., Paystack), avoid predictable formats like Date.now(). Instead, append a cryptographically secure random identifier (e.g., using generateSecureId from utils/crypto) to prevent transaction enumeration or replay attacks."
**Prevention:** Use cryptographically secure random values (e.g. `generateSecureId()`) along with `Date.now()` to ensure transaction uniqueness and unpredictability.
