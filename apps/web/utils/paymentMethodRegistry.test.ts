import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { PaymentMethodStrategy } from './paymentMethodRegistry';

describe('paymentMethodRegistry', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('returns all registered payment methods initially', async () => {
    const { getAllPaymentMethods } = await import('./paymentMethodRegistry');
    const allMethods = getAllPaymentMethods();

    // Verify some of the default registered methods are present
    expect(allMethods).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'Bank Transfer' }),
        expect.objectContaining({ value: 'Paystack' }),
        expect.objectContaining({ value: 'Remita' })
      ])
    );
    expect(allMethods.length).toBeGreaterThan(0);
  });

  it('returns only the payment methods flagged as quick', async () => {
    const { getQuickPaymentMethods } = await import('./paymentMethodRegistry');
    const quickMethods = getQuickPaymentMethods();

    // Verify all returned methods have isQuickMethod set to true
    expect(quickMethods.every(m => m.isQuickMethod)).toBe(true);

    // Verify specific known quick methods are in the list
    expect(quickMethods).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'Bank Transfer' }),
        expect.objectContaining({ value: 'Cash' })
      ])
    );

    // Verify a known non-quick method is not in the list
    expect(quickMethods).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'Remita' })
      ])
    );
  });

  it('successfully registers a new payment method strategy without polluting other tests', async () => {
    const { registerPaymentMethod, getAllPaymentMethods, getQuickPaymentMethods } = await import('./paymentMethodRegistry');

    const newMethod: PaymentMethodStrategy = {
      value: 'TestMethod',
      name: 'Test Method',
      icon: '🧪',
      desc: 'A method for testing',
      isQuickMethod: true
    };

    const initialCount = getAllPaymentMethods().length;

    registerPaymentMethod(newMethod);

    const allMethods = getAllPaymentMethods();
    expect(allMethods).toContainEqual(newMethod);
    expect(allMethods.length).toBe(initialCount + 1);

    const quickMethods = getQuickPaymentMethods();
    expect(quickMethods).toContainEqual(newMethod);
  });
});
