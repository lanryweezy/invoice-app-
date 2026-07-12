/**
 * NRS API Configuration
 */

export interface NrsApiConfig {
  baseUrl: string;
  apiKey: string;
  tin: string;
  sandbox: boolean;
}

let config: NrsApiConfig = {
  baseUrl: 'https://api.nrs.gov.ng',
  apiKey: '',
  tin: '',
  sandbox: true,
};

export function getApiConfig(): NrsApiConfig {
  return config;
}

export function setApiKey(apiKey: string): void {
  config.apiKey = apiKey;
}

export function setTin(tin: string): void {
  config.tin = tin;
}

export function setSandbox(sandbox: boolean): void {
  config.sandbox = sandbox;
  config.baseUrl = sandbox ? 'https://sandbox.nrs.gov.ng' : 'https://api.nrs.gov.ng';
}

export function getHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.apiKey}`,
    'X-TIN': config.tin,
    'X-Environment': config.sandbox ? 'sandbox' : 'production',
  };
}

export async function apiRequest(
  endpoint: string,
  method: string = 'GET',
  body?: any
): Promise<any> {
  const url = `${config.baseUrl}${endpoint}`;
  const headers = getHeaders();

  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const duration = Date.now() - startTime;
    logApiCall(endpoint, method, duration, response.status);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new NrsApiError(response.status, error.message || 'Request failed', endpoint);
    }

    return await response.json();
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      throw new NrsApiError(408, 'Request timed out', endpoint);
    }
    if (error instanceof NrsApiError) throw error;
    throw new NrsApiError(0, (error as Error).message, endpoint);
  } finally {
    clearTimeout(timeoutId);
  }
}

export class NrsApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public endpoint: string
  ) {
    super(message);
    this.name = 'NrsApiError';
  }
}

function logApiCall(endpoint: string, method: string, duration: number, status: number): void {
  console.log(`[NRS API] ${method} ${endpoint} - ${status} (${duration}ms)`);
}
