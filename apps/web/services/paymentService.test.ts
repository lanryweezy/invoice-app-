import { describe, it, expect } from 'vitest';
import { PaystackAdapter, FlutterwaveAdapter } from './paymentService';

describe('Payment Adapters', () => {
  const customer = { id: 'cust123', email: 'test@example.com', firstName: 'John' };

  it('PaystackAdapter initializes correctly', async () => {
    const adapter = new PaystackAdapter('test-key');
    const link = await adapter.initialize(1000, 'NGN', customer, 'inv123');
    expect(link.url).toBe('https://paystack.com/pay/inv123');
  });

  it('FlutterwaveAdapter initializes correctly', async () => {
    const adapter = new FlutterwaveAdapter('test-key');
    const link = await adapter.initialize(1000, 'NGN', customer, 'inv123');
    expect(link.url).toBe('https://flutterwave.com/pay/inv123');
  });
});
