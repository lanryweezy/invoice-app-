/**
 * Rev360 Portal API Client
 */

import { apiRequest } from './apiConfig';

export interface Rev360Credentials {
  clientId: string;
  clientSecret: string;
  tin: string;
}

export interface AuthResult {
  success: boolean;
  accessToken?: string;
  expiresIn?: number;
  message?: string;
}

export interface VATReturn {
  period: string;
  totalSales: number;
  totalPurchases: number;
  outputVAT: number;
  inputVAT: number;
  netVAT: number;
}

export class Rev360Api {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(private baseUrl: string = 'https://rev360.nrs.gov.ng/api') {}

  // 🌱 Flora: Wraps native fetch with AbortController to prevent indefinite UI hangs if rev360.nrs.gov.ng drops connections
  private async fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 15000): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      return response;
    } finally {
      clearTimeout(id);
    }
  }

  async authenticate(credentials: Rev360Credentials): Promise<AuthResult> {
    try {
      const result = await this.fetchWithTimeout(`${this.baseUrl}/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!result.ok) {
        return { success: false, message: 'Authentication failed' };
      }

      const data = await result.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000);
      return { success: true, accessToken: data.access_token, expiresIn: data.expires_in };
    } catch (error) {
      return { success: false, message: (error as Error).message };
    }
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.accessToken}`,
    };
  }

  async registerInvoice(invoice: any): Promise<any> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/invoices/register`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(invoice),
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: (error as Error).message };
    }
  }

  async fileVATReturn(vatReturn: VATReturn): Promise<any> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/vat/returns`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(vatReturn),
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: (error as Error).message };
    }
  }

  async generateWHTCertificate(invoice: any): Promise<any> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/wht/certificate`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(invoice),
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: (error as Error).message };
    }
  }

  async checkCompliance(tin: string): Promise<any> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/compliance/status/${tin}`, {
        headers: this.getHeaders(),
      });
      return await response.json();
    } catch (error) {
      return { status: 'unknown', message: 'Compliance check failed' };
    }
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.accessToken}`,
    };
  }
}

export const rev360Api = new Rev360Api();
