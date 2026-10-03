export interface Customer {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface PaymentLink {
  url: string;
  reference: string;
}

export interface VirtualAccount {
  accountName: string;
  accountNumber: string;
  bankName: string;
  reference: string;
}

export interface PaymentStatus {
  status: 'success' | 'failed' | 'pending';
  reference: string;
  amount: number;
  currency: string;
  providerTransactionId?: string;
}

export interface RefundStatus {
  status: 'success' | 'failed' | 'pending';
  reference: string;
}

export interface PaymentProvider {
  initialize(amount: number, currency: string, customer: Customer, invoiceId: string): Promise<PaymentLink>;
  verify(reference: string): Promise<PaymentStatus>;
  refund(transactionId: string, amount?: number): Promise<RefundStatus>;
  createVirtualAccount(customer: Customer): Promise<VirtualAccount>;
  get(reference: string): Promise<PaymentStatus>;
  createPaymentLink(amount: number, currency: string, customer: Customer, invoiceId: string): Promise<PaymentLink>;
  getPaymentStatus(reference: string): Promise<PaymentStatus>;
}

export class PaystackAdapter implements PaymentProvider {
  private secretKey: string;

  constructor(secretKey: string) {
    this.secretKey = secretKey;
  }

  async initialize(amount: number, currency: string, customer: Customer, invoiceId: string): Promise<PaymentLink> {
    // Stubbed implementation for Paystack
    return { url: `https://paystack.com/pay/${invoiceId}`, reference: `PAYSTACK-${Date.now()}` };
  }

  async verify(reference: string): Promise<PaymentStatus> {
    return { status: 'success', reference, amount: 1000, currency: 'NGN' };
  }

  async refund(transactionId: string, amount?: number): Promise<RefundStatus> {
    return { status: 'success', reference: transactionId };
  }

  async createVirtualAccount(customer: Customer): Promise<VirtualAccount> {
    return { accountName: customer.firstName || 'Customer', accountNumber: '0123456789', bankName: 'Paystack Bank', reference: `DVA-${Date.now()}` };
  }

  async get(reference: string): Promise<PaymentStatus> {
    return this.verify(reference);
  }

  async createPaymentLink(amount: number, currency: string, customer: Customer, invoiceId: string): Promise<PaymentLink> {
    return this.initialize(amount, currency, customer, invoiceId);
  }

  async getPaymentStatus(reference: string): Promise<PaymentStatus> {
     return this.verify(reference);
  }
}

export class FlutterwaveAdapter implements PaymentProvider {
  private secretKey: string;

  constructor(secretKey: string) {
    this.secretKey = secretKey;
  }

  async initialize(amount: number, currency: string, customer: Customer, invoiceId: string): Promise<PaymentLink> {
    // Stubbed implementation for Flutterwave
    return { url: `https://flutterwave.com/pay/${invoiceId}`, reference: `FLW-${Date.now()}` };
  }

  async verify(reference: string): Promise<PaymentStatus> {
    return { status: 'success', reference, amount: 1000, currency: 'NGN' };
  }

  async refund(transactionId: string, amount?: number): Promise<RefundStatus> {
    return { status: 'success', reference: transactionId };
  }

  async createVirtualAccount(customer: Customer): Promise<VirtualAccount> {
    return { accountName: customer.firstName || 'Customer', accountNumber: '9876543210', bankName: 'Wema Bank', reference: `FLW-DVA-${Date.now()}` };
  }

  async get(reference: string): Promise<PaymentStatus> {
    return this.verify(reference);
  }

  async createPaymentLink(amount: number, currency: string, customer: Customer, invoiceId: string): Promise<PaymentLink> {
    return this.initialize(amount, currency, customer, invoiceId);
  }

  async getPaymentStatus(reference: string): Promise<PaymentStatus> {
     return this.verify(reference);
  }
}
