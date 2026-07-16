import { getConfig, saveConfig } from './config';
import { AppConfig } from '../types';

export function loginWithToken(token: string): void {
  const config = getConfig();
  config.idToken = token;
  saveConfig(config);
}

export function getAuthToken(): string | undefined {
  const config = getConfig();
  return config.idToken;
}

export function logout(): void {
  const config = getConfig();
  config.userId = undefined;
  config.email = undefined;
  config.idToken = undefined;
  config.refreshToken = undefined;
  saveConfig(config);
}

export function getCurrentUser(): { userId?: string; email?: string } {
  const config = getConfig();
  return {
    userId: config.userId,
    email: config.email,
  };
}

export function isAuthenticated(): boolean {
  const config = getConfig();
  return !!config.userId && !!config.idToken;
}
