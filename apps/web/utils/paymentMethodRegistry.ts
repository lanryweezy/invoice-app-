/**
 * 🔩 Hinge Extension Point: PaymentMethodStrategy
 *
 * Pressure: The `PaymentModal` and `InvoiceForm` components had hardcoded arrays
 * of payment gateways (Paystack, Flutterwave, etc.) that required modification
 * in multiple places whenever a new gateway was added.
 *
 * Contract:
 * - Implementors provide a `PaymentMethodStrategy` with an ID (value), name,
 *   icon, description, and an optional `isQuickMethod` flag.
 * - The registry provides methods to get all gateways or just the quick methods.
 */
export interface PaymentMethodStrategy {
  value: string;
  name: string;
  icon: string;
  desc: string;
  isQuickMethod?: boolean;
}

const paymentMethodStrategies = new Map<string, PaymentMethodStrategy>();

export function registerPaymentMethod(strategy: PaymentMethodStrategy): void {
  paymentMethodStrategies.set(strategy.value, strategy);
}

export function getAllPaymentMethods(): PaymentMethodStrategy[] {
  return Array.from(paymentMethodStrategies.values());
}

export function getQuickPaymentMethods(): PaymentMethodStrategy[] {
  return Array.from(paymentMethodStrategies.values()).filter(m => m.isQuickMethod);
}

// Register default quick methods
registerPaymentMethod({ value: 'Bank Transfer', name: 'Bank Transfer', icon: '🏦', desc: 'Direct bank transfer', isQuickMethod: true });
registerPaymentMethod({ value: 'Paystack', name: 'Paystack', icon: '💳', desc: 'Card / USSD / Bank', isQuickMethod: true });
registerPaymentMethod({ value: 'Flutterwave', name: 'Flutterwave', icon: '🌊', desc: 'Card / Bank / Mobile', isQuickMethod: true });
registerPaymentMethod({ value: 'Cash', name: 'Cash', icon: '💵', desc: 'Physical cash', isQuickMethod: true });
registerPaymentMethod({ value: 'OPay', name: 'OPay', icon: '📱', desc: 'OPay wallet', isQuickMethod: true });
registerPaymentMethod({ value: 'Other', name: 'Other', icon: '📋', desc: 'Other method', isQuickMethod: true });

// Register additional methods
registerPaymentMethod({ value: 'Remita', name: 'Remita', icon: '🏛️', desc: 'TSA / Corporate' });
registerPaymentMethod({ value: 'Monnify', name: 'Monnify', icon: '🔗', desc: 'Bank / Card' });
registerPaymentMethod({ value: 'Kora', name: 'Kora', icon: '💳', desc: 'Bank transfer' });
registerPaymentMethod({ value: 'Squad', name: 'Squad', icon: '⚡', desc: 'Instant pay' });
registerPaymentMethod({ value: 'Interswitch', name: 'Interswitch', icon: '🔄', desc: 'Card / Bank' });
registerPaymentMethod({ value: 'Fincra', name: 'Fincra', icon: '💰', desc: 'Business pay' });
